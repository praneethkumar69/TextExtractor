import { createWorker } from 'tesseract.js';

// Serverless-safe timeout — Tesseract workers can hang during cold starts on Vercel
const OCR_SERVERLESS_TIMEOUT_MS = 4_500;

/**
 * Performs OCR on an image buffer or file path using Tesseract.js.
 * Uses a Promise.race timeout guard for Vercel serverless compatibility.
 *
 * @param {Buffer|string} imageSource - Image buffer or file path
 * @param {string} lang - Tesseract language code (default: 'eng')
 * @returns {Promise<{text: string, confidence: number, method: string}>}
 */
export async function extractTextFromImage(imageSource, lang = 'eng') {
  let worker = null;

  const ocrTask = (async () => {
    try {
      worker = await createWorker(lang, 1, {
        logger: () => {},   // suppress verbose progress logs
        cachePath: '/tmp'   // required for Vercel read-only filesystem
      });

      const ocrResult = await worker.recognize(imageSource);

      let extractedText = ocrResult.data.text ? ocrResult.data.text.trim() : '';
      extractedText = extractedText.replace(/\n{3,}/g, '\n\n');

      const confidence = Math.round(ocrResult.data.confidence || 0);

      return {
        text: extractedText,
        confidence,
        method: 'tesseract-ocr'
      };
    } catch (error) {
      console.warn('[ocrExtractor] Tesseract recognition failed:', error.message || error);
      return {
        text: '',
        confidence: 0,
        method: 'ocr-failed'
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Worker termination errors are non-critical; suppress silently
        }
      }
    }
  })();

  const timeoutTask = new Promise((resolve) => {
    setTimeout(() => {
      console.warn(`[ocrExtractor] Tesseract exceeded ${OCR_SERVERLESS_TIMEOUT_MS}ms serverless limit. Returning empty result.`);
      resolve({
        text: '',
        confidence: 0,
        method: 'ocr-timeout'
      });
    }, OCR_SERVERLESS_TIMEOUT_MS);
  });

  return Promise.race([ocrTask, timeoutTask]);
}
