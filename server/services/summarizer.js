import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Heuristic/NLP Fallback Summarizer when AI API key is not present or fails
 */
function fallbackSummarize(text, length = 'medium') {
  const cleanText = text.trim();
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return {
      summary: "The document contains minimal or unreadable textual content.",
      keyPoints: ["No clear text structure detected."],
      mainIdeas: ["Verify document resolution or formatting."],
      improvementSuggestions: ["Provide a higher resolution scan or readable document."]
    };
  }

  // Frequency-based sentence scoring
  const words = cleanText.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
  const freqMap = {};
  const stopWords = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'from', 'you', 'are', 'have', 'was', 'not', 'but', 'all', 'can', 'has', 'her', 'his', 'been', 'which']);
  
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

  // Target sentence count based on length
  let count = 3;
  if (length === 'short') count = 2;
  if (length === 'long') count = 6;

  const topSentences = scoredSentences.slice(0, count).map(s => s.sentence);
  
  // Re-order top sentences by their original appearance in document
  const summarySentences = sentences.filter(s => topSentences.includes(s));
  const summary = summarySentences.join(' ');

  // Extract Key Points
  const keyPoints = scoredSentences
    .slice(0, Math.min(scoredSentences.length, 5))
    .map(item => item.sentence);

  // Derive Main Ideas
  const topKeywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  const mainIdeas = [
    `Primary focus areas include: ${topKeywords.slice(0, 3).join(', ')}.`,
    `Core themes center around document concepts and domain terminology.`
  ];

  // Derive Improvement Suggestions based on structural analysis
  const improvementSuggestions = [];
  if (sentences.length < 5) {
    improvementSuggestions.push("Expand document sections with detailed explanations and background context.");
  }
  if (cleanText.length > 3000 && !cleanText.includes('\n\n')) {
    improvementSuggestions.push("Add visual headings, bulleted lists, and paragraph breaks to improve readability.");
  }
  improvementSuggestions.push("Ensure key numerical metrics or action items are explicitly highlighted in a dedicated summary section.");
  improvementSuggestions.push("Review formatting for consistent section headers and terminology across pages.");

  return {
    summary,
    keyPoints,
    mainIdeas,
    improvementSuggestions,
    engine: 'heuristic-fallback'
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prompt tailoring based on length option
    let lengthInstruction = 'Provide a balanced, multi-paragraph summary (~200-300 words).';
    if (length === 'short') {
      lengthInstruction = 'Provide a brief, high-level overview in 1-2 concise paragraphs (~100 words).';
    } else if (length === 'long') {
      lengthInstruction = 'Provide a comprehensive, in-depth summary with section-by-section details (~400-600 words).';
    }

    const prompt = `
You are an expert document analyzer. Analyze the provided document text and generate a structured JSON output.

Length Specification: ${lengthInstruction}
${userPrompt ? `Additional Instructions: ${userPrompt}` : ''}

Output strictly valid JSON (wrapped in triple backticks \`\`\`json ... \`\`\` or raw JSON) with the following key structure:
{
  "summary": "Full cohesive summary text formatted cleanly with paragraphs",
  "keyPoints": ["Bulleted key point 1", "Bulleted key point 2", "Bulleted key point 3"],
  "mainIdeas": ["Core main idea 1", "Core main idea 2"],
  "improvementSuggestions": [
    "Constructive suggestion for document clarity, structure, or content improvement 1",
    "Constructive suggestion 2",
    "Constructive suggestion 3"
  ]
}

Document Text:
"""
${text.slice(0, 25000)}
"""
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Strip markdown codeblock backticks if present
    responseText = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    const parsed = JSON.parse(responseText);

    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      mainIdeas: parsed.mainIdeas || [],
      improvementSuggestions: parsed.improvementSuggestions || [],
      engine: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.error('[Summarizer Gemini Error]:', error.message);
    console.log('[Summarizer] Falling back to heuristic summary engine.');
    const result = fallbackSummarize(text, length);
    result.errorNote = `Gemini API call failed (${error.message}). Showing heuristic summary.`;
    return result;
  }
}
