import { createWorker } from 'tesseract.js';

/**
 * Performs OCR on an image buffer or file path
 * @param {Buffer|string} imageSource - Image buffer or file path
 * @param {string} lang - Language for OCR (default 'eng')
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(imageSource, lang = 'eng') {
  let worker = null;
  try {
    worker = await createWorker(lang);
    const ret = await worker.recognize(imageSource);
    
    let extractedText = ret.data.text ? ret.data.text.trim() : '';
    extractedText = extractedText.replace(/\n{3,}/g, '\n\n');

    const confidence = Math.round(ret.data.confidence || 0);

    return {
      text: extractedText,
      confidence,
      method: 'tesseract-ocr'
    };
  } catch (error) {
    console.error('[ocrExtractor Error]:', error);
    throw new Error(`Failed to extract text from image using OCR: ${error.message}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
