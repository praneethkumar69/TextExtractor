import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractTextFromImage } from './ocrExtractor.js';

// Module-level cached Gemini client — avoids re-instantiating on every request
let _cachedGenAI = null;
let _cachedApiKey = null;

/**
 * Returns a cached GoogleGenerativeAI instance, re-creating only when the API key changes.
 * @param {string} apiKey
 * @returns {GoogleGenerativeAI}
 */
function getGenAIClient(apiKey) {
  if (!_cachedGenAI || _cachedApiKey !== apiKey) {
    _cachedGenAI = new GoogleGenerativeAI(apiKey);
    _cachedApiKey = apiKey;
  }
  return _cachedGenAI;
}

/** Maximum character count sent to Gemini; trimmed at a word boundary to avoid token mid-cuts */
const MAX_CONTEXT_CHARS = 35_000;

/**
 * Heuristic/NLP Fallback Summarizer when AI API key is not present or fails
 */
function fallbackSummarize(text, length = 'medium') {
  const cleanText = text.trim();
  
  // Filter out common document boilerplate, footers, URLs, and template placeholders
  const boilerplateRegex = /^(best regards|sincerely|yours truly|working application url|\[your name\]|\[company name\]|page \d+ of \d+|copyright \d+|all rights reserved)/i;
  
  const rawSentences = cleanText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && !boilerplateRegex.test(s));

  // Remove sentences that are purely generic sign-offs or URL links
  const sentences = rawSentences.filter(s => {
    const lower = s.toLowerCase();
    if (lower.includes('best regards') || lower.includes('[your name]') || lower.includes('[company name]')) return false;
    if (lower.startsWith('http://') || lower.startsWith('https://')) return false;
    if (lower.includes('working application url')) return false;
    return true;
  });

  if (sentences.length === 0) {
    return {
      summary: "The document contains minimal text or template placeholders. Please upload a clear document or image containing descriptive text content for full AI analysis.",
      keyPoints: ["No clear text structure detected."],
      mainIdeas: ["Verify document content and formatting."],
      improvementSuggestions: ["Provide a document with detailed textual content."]
    };
  }

  // Frequency-based sentence scoring
  const words = cleanText.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
  const freqMap = {};
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'you', 'are', 'have', 'was', 'not', 'but', 
    'all', 'can', 'has', 'her', 'his', 'been', 'which', 'their', 'they', 'were', 'will', 'would', 
    'could', 'should', 'more', 'about', 'some', 'than', 'them', 'your', 'name', 'company', 'regards',
    'url', 'application', 'working', 'best', 'page'
  ]);
  
  words.forEach(word => {
    if (!stopWords.has(word)) {
      freqMap[word] = (freqMap[word] || 0) + 1;
    }
  });

  const scoredSentences = sentences.map(sentence => {
    const sWords = sentence.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
    let score = 0;
    sWords.forEach(w => {
      score += (freqMap[w] || 0);
    });
    return { sentence, score: score / Math.max(sWords.length, 1) };
  });

  scoredSentences.sort((a, b) => b.score - a.score);

  // Derive top keywords for intelligent synthesis
  const topKeywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  const domainContext = topKeywords.length > 0 ? topKeywords.slice(0, 5).join(', ') : 'core topics';

  // Target sentence & bullet count configuration
  let keyPointCount = 5;
  let mainIdeaCount = 4;

  if (length === 'short') {
    keyPointCount = Math.min(sentences.length, 3);
    mainIdeaCount = 2;
  } else if (length === 'long') {
    keyPointCount = Math.min(sentences.length, 8);
    mainIdeaCount = 6;
  } else {
    keyPointCount = Math.min(sentences.length, 5);
    mainIdeaCount = 4;
  }

  // Take the top N highest-scored sentences (capped at 10) to build the summary
  const topSentences = scoredSentences.slice(0, Math.min(sentences.length, 10)).map(s => s.sentence);
  const summarySentences = sentences.filter(s => topSentences.includes(s));
  
  // Format summary into distinct paragraphs tailored specifically to selected length
  let paragraphs = [];

  if (length === 'short') {
    // SHORT MODE: 1 concise paragraph (~75 words) focused purely on top core sentences
    const topShortText = summarySentences.slice(0, 2).join(' ');
    const p1 = `Executive Overview:\n${topShortText || cleanText.slice(0, 200)}`;
    paragraphs = [p1];
  } else if (length === 'medium') {
    // MEDIUM MODE: 2–3 balanced paragraphs (~200 words)
    const part1 = summarySentences.slice(0, Math.max(1, Math.ceil(summarySentences.length / 2))).join(' ');
    const part2 = summarySentences.slice(Math.ceil(summarySentences.length / 2)).join(' ');

    const p1 = `Executive Overview & Primary Focus:\nThis document highlights core information regarding ${domainContext}. ${part1}`;
    const p2 = `Key Operational Insights:\nThe material details essential operational procedures and technical terminology. ${part2 || `Further details emphasize structured clarity and domain principles across ${domainContext}.`}`;
    const p3 = `Summary Takeaway:\nIn conclusion, the document serves as an actionable reference outlining foundational concepts and key procedural requirements.`;
    paragraphs = [p1, p2, p3];
  } else {
    // LONG MODE: Detailed multi-section breakdown (~500+ words)
    const sec1 = summarySentences.slice(0, 2).join(' ');
    const sec2 = summarySentences.slice(2, 5).join(' ');
    const sec3 = summarySentences.slice(5).join(' ');

    const p1 = `1. Comprehensive Executive Summary:\nThis document presents an in-depth, multi-dimensional analysis centered around ${domainContext}. The content establishes core objectives, contextual frameworks, and detailed domain definitions intended to provide total clarity across all operational and structural aspects. ${sec1}`;
    const p2 = `2. Detailed Subject Breakdown & Core Findings:\n${sec2 || `Further analysis examines structural flow, section clarity, and implementation benchmarks.`} Furthermore, the document highlights essential operational procedures, critical dependencies, and key conceptual milestones to ensure thorough contextual understanding.`;
    const p3 = `3. Structural Context & Terminology Analysis:\n${sec3 || `The framework reviews domain terminology including ${domainContext}, evaluating procedural requirements and quality assurance standards.`} Each identified section contributes directly to the overall narrative, providing structural context and background rationale for the documented findings.`;
    const p4 = `4. Operational Implications & Systemic Evaluation:\nAdditional emphasis is placed on maintaining procedural consistency, validating source information, and ensuring that all documented metrics align with target specifications. The analysis identifies potential operational risks, procedural bottlenecks, and quality assurance checkpoints necessary for execution.`;
    const p5 = `5. Strategic Takeaways & Concluding Summary:\nIn conclusion, the document serves as a comprehensive reference detailing critical concepts, procedural frameworks, and domain-specific terminology. The combination of structural rigor and detailed subject coverage ensures that all readers gain a complete, actionable understanding.`;
    paragraphs = [p1, p2, p3, p4, p5];
  }

  const summary = paragraphs.join('\n\n');

  // Extract Key Points proportional to length
  const keyPoints = scoredSentences
    .slice(0, Math.min(scoredSentences.length, keyPointCount))
    .map(item => item.sentence);

  const mainIdeas = [];
  if (topKeywords.length > 0) {
    mainIdeas.push(`Primary Topic: Document content centers on ${topKeywords.slice(0, 3).join(', ')}.`);
  }
  if (topKeywords.length > 3) {
    mainIdeas.push(`Core Subject: Key terminology highlights ${topKeywords.slice(3, 6).join(', ')}.`);
  }
  if (mainIdeaCount >= 4 && topKeywords.length > 6) {
    mainIdeas.push(`Operational Context: Details focus on ${topKeywords.slice(6, 8).join(', ')}.`);
    mainIdeas.push(`Purpose: Outlines important guidelines and document details.`);
  }
  if (mainIdeaCount >= 6 && topKeywords.length > 8) {
    mainIdeas.push(`Detailed Insight: Technical terms like ${topKeywords.slice(8, 10).join(', ')} are highlighted.`);
    mainIdeas.push(`Summary Scope: In-depth analysis of multi-section document content.`);
  }

  // Derive Improvement Suggestions based on structural analysis
  const improvementSuggestions = [];
  if (sentences.length < 5) {
    improvementSuggestions.push("Expand document content with detailed background explanations and section headings.");
  }
  if (cleanText.length > 3000 && !cleanText.includes('\n\n')) {
    improvementSuggestions.push("Add visual headings, bulleted lists, and paragraph breaks to improve readability.");
  }
  improvementSuggestions.push("Ensure key numerical metrics, action items, or specific conclusions are explicitly structured.");
  improvementSuggestions.push("Review formatting for consistent section headers and domain terminology.");

  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Document content extracted and processed.'],
    mainIdeas: mainIdeas.length > 0 ? mainIdeas : ['Primary document concepts captured.'],
    improvementSuggestions,
    engine: 'heuristic-fallback',
    isFallback: true
  };
}

/**
 * Generates structured AI summary using Google Gemini API or Fallback
 * @param {string} text - Extracted document text
 * @param {string} length - 'short' | 'medium' | 'long'
 * @param {string} [customApiKey] - Optional API key provided by user
 * @param {string} [userPrompt] - Optional user instructions
 * @returns {Promise<object>}
 */
export async function generateSummary(text, length = 'medium', customApiKey = '', userPrompt = '') {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Summarizer] No Gemini API key provided. Using heuristic summary engine.');
    return fallbackSummarize(text, length);
  }

  // Candidate models to try in order of preference
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  // Tailor prompt specifically for requested length with strict word count minimums
  let lengthSpec = '';
  if (length === 'short') {
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": Minimum 75 to 120 words.
- PARAGRAPH FORMATTING: Exactly 1 concise summary paragraph.
- KEY POINTS: Exactly 2 to 3 concise bullet points.
- MAIN IDEAS: Exactly 2 key concepts.
`;
  } else if (length === 'long') {
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": MUST BE AT LEAST 450 TO 700 WORDS LONG. YOU MUST WRITE AN EXTENSIVE, HIGHLY DETAILED, MULTI-PARAGRAPH ANALYSIS. DO NOT SHORTEN OR CONDENSE.
- PARAGRAPH FORMATTING: 4 to 6 detailed paragraphs separated by double line breaks (\\n\\n). Include in-depth analysis of every section, background, structural context, numerical data, operational implications, and comprehensive conclusions.
- KEY POINTS: Exactly 6 to 8 detailed, context-rich bullet points with complete explanations.
- MAIN IDEAS: Exactly 5 to 6 comprehensive main themes.
`;
  } else {
    // medium
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": Minimum 200 to 350 words.
- PARAGRAPH FORMATTING: 2 to 3 well-structured paragraphs separated by double line breaks (\\n\\n).
- KEY POINTS: Exactly 4 to 5 key points.
- MAIN IDEAS: Exactly 3 to 4 core themes.
`;
  }

  // Trim at the nearest word boundary before the character limit to avoid cutting mid-token
  const contextText = text.length > MAX_CONTEXT_CHARS
    ? text.slice(0, text.lastIndexOf(' ', MAX_CONTEXT_CHARS))
    : text;

  const prompt = `
You are an expert document analyzer and executive summary writer. Read the provided document text thoroughly and generate a structured JSON output.

STRICT LENGTH & WORD COUNT REQUIREMENTS FOR THIS REQUEST (${length.toUpperCase()}):
${lengthSpec}
${userPrompt ? `Additional User Instructions: ${userPrompt}` : ''}

CRITICAL INSTRUCTIONS:
1. The "summary" JSON string value MUST satisfy the word count requirement for ${length.toUpperCase()} (Short: 75-120 words | Medium: 200-350 words | Long: 450-700+ words).
2. If the input document or photo text is brief, thoroughly analyze, explain, elaborate, and contextualize all concepts, background implications, technical terminology, and key sections to meet the required word count.
3. Ignore footers, email sign-offs ("Best regards"), template placeholders ("[Your Name]"), and URLs unless relevant.
4. Output MUST be strictly valid JSON (wrapped in triple backticks \`\`\`json ... \`\`\` or raw JSON).

JSON Schema:
{
  "summary": "Full cohesive summary text formatted cleanly with paragraph breaks (\\n\\n between paragraphs)",
  "keyPoints": ["Bulleted key point 1", "Bulleted key point 2"],
  "mainIdeas": ["Core main idea 1", "Core main idea 2"],
  "improvementSuggestions": [
    "Constructive suggestion 1",
    "Constructive suggestion 2"
  ]
}

Document Text:
"""
${contextText}
"""
`;

  let lastError = null;
  const genAI = getGenAIClient(apiKey);

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Strip markdown codeblock backticks if present
      responseText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(responseText);

      return {
        summary: parsed.summary || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        mainIdeas: Array.isArray(parsed.mainIdeas) ? parsed.mainIdeas : [],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
        engine: modelName
      };
    } catch (err) {
      console.warn(`[Summarizer] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  console.error('[Summarizer Gemini Error]: All Gemini model attempts failed.', lastError?.message);
  console.log('[Summarizer] Falling back to heuristic summary engine.');
  const result = fallbackSummarize(text, length);
  result.errorNote = `Gemini API call failed (${lastError?.message || 'API error'}). Showing fallback summary.`;
  return result;
}

/**
 * Generates structured AI summary directly from an Image/Photo file buffer using Gemini Multimodal Vision API or OCR Fallback
 * @param {Buffer} imageBuffer - Buffer containing image binary data
 * @param {string} mimeType - Image mime type ('image/png', 'image/jpeg', 'image/webp', etc.)
 * @param {string} length - 'short' | 'medium' | 'long'
 * @param {string} [customApiKey] - Optional API key
 * @param {string} [userPrompt] - Optional instructions
 * @returns {Promise<object>}
 */
export async function generateSummaryFromImage(imageBuffer, mimeType = 'image/jpeg', length = 'medium', customApiKey = '', userPrompt = '') {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Summarizer Image] No Gemini API key provided. Executing Tesseract OCR + Heuristic fallback.');
    const ocrResult = await extractTextFromImage(imageBuffer);
    const textToSummarize = ocrResult.text && ocrResult.text.length > 5 
      ? ocrResult.text 
      : "Uploaded document image contains photo content. Please set your Gemini API key in the top header for instant AI vision extraction and summary.";
    const summaryRes = fallbackSummarize(textToSummarize, length);
    return {
      extractedText: textToSummarize,
      method: ocrResult.method || 'tesseract-ocr',
      ...summaryRes
    };
  }

  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  let lengthSpec = '';
  if (length === 'short') {
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": Minimum 75 to 120 words.
- PARAGRAPH FORMATTING: Exactly 1 concise summary paragraph.
- KEY POINTS: Exactly 2 to 3 bullet points.
- MAIN IDEAS: Exactly 2 key concepts.
`;
  } else if (length === 'long') {
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": MUST BE AT LEAST 450 TO 700 WORDS LONG. WRITE AN EXTENSIVE, HIGHLY DETAILED MULTI-PARAGRAPH ANALYSIS.
- PARAGRAPH FORMATTING: 4 to 6 detailed paragraphs separated by double line breaks (\\n\\n). Include full in-depth breakdown of every text block, table, sign, or content in the photo.
- KEY POINTS: Exactly 6 to 8 detailed bullet points.
- MAIN IDEAS: Exactly 5 to 6 main themes.
`;
  } else {
    // medium
    lengthSpec = `
- MANDATORY WORD COUNT FOR "summary": Minimum 200 to 350 words.
- PARAGRAPH FORMATTING: 2 to 3 well-structured paragraphs separated by double line breaks (\\n\\n).
- KEY POINTS: Exactly 4 to 5 key points.
- MAIN IDEAS: Exactly 3 to 4 core themes.
`;
  }

  const prompt = `
You are an expert document OCR transcriber and executive summary writer. Analyze the provided image/photo thoroughly.

CRITICAL INSTRUCTIONS:
1. "extractedText": Transcribe ALL readable text from the photo completely and accurately, preserving line breaks and sections.
2. "summary": Write a complete, cohesive executive summary of the photo's content following strict word count rules for ${length.toUpperCase()} (Short: 75-120 words | Medium: 200-350 words | Long: 450-700+ words).
3. "keyPoints": Extract 3 to 8 clear bullet points.
4. "mainIdeas": Highlight core themes and topics.
5. Ignore unrelated background noise, footers, or email sign-offs ("Best regards") unless relevant.
6. Output MUST be strictly valid JSON.

JSON Schema:
{
  "extractedText": "Complete text transcribed from the image photo",
  "summary": "Full cohesive summary text formatted cleanly with paragraph breaks (\\n\\n between paragraphs)",
  "keyPoints": ["Bulleted key point 1", "Bulleted key point 2"],
  "mainIdeas": ["Core main idea 1", "Core main idea 2"],
  "improvementSuggestions": [
    "Constructive suggestion 1",
    "Constructive suggestion 2"
  ]
}
`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType || 'image/jpeg'
    }
  };

  let lastError = null;
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      let responseText = result.response.text();
      
      responseText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(responseText);

      return {
        extractedText: parsed.extractedText || 'Image text transcribed via Gemini Vision AI',
        summary: parsed.summary || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        mainIdeas: Array.isArray(parsed.mainIdeas) ? parsed.mainIdeas : [],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
        engine: `${modelName}-vision`,
        method: 'gemini-vision'
      };
    } catch (err) {
      console.warn(`[Summarizer Vision] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  console.error('[Summarizer Gemini Vision Error]: All Gemini vision model attempts failed.', lastError?.message);
  const ocrResult = await extractTextFromImage(imageBuffer);
  const fallbackRes = fallbackSummarize(ocrResult.text || '', length);
  fallbackRes.extractedText = ocrResult.text || '';
  fallbackRes.method = ocrResult.method || 'tesseract-ocr';
  fallbackRes.errorNote = `Gemini Vision API call failed (${lastError?.message || 'API error'}). Showing fallback OCR summary.`;
  return fallbackRes;
}



