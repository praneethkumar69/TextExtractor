import pdfParse from 'pdf-parse';

/**
 * Extracts text and metadata from a PDF file buffer
 * @param {Buffer} dataBuffer - Buffer containing PDF data
 * @returns {Promise<{text: string, numPages: number, info: object, method: string}>}
 */
export async function extractTextFromPDF(dataBuffer) {
  try {
    const data = await pdfParse(dataBuffer);
    
    // Clean up extraneous whitespace
    let extractedText = data.text ? data.text.trim() : '';
    extractedText = extractedText.replace(/\n{3,}/g, '\n\n');

    return {
      text: extractedText,
      numPages: data.numpages || 1,
      info: data.info || {},
      method: 'pdf-parse'
    };
  } catch (error) {
    console.error('[pdfExtractor Error]:', error.message);
    
    // Fallback: If buffer contains raw readable text (e.g. text/plain uploaded as pdf)
    const rawString = dataBuffer.toString('utf-8');
    const printableMatches = rawString.match(/[\x20-\x7E\s]{10,}/g);
    if (printableMatches && printableMatches.join(' ').length > 20) {
      const recoveredText = printableMatches.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      return {
        text: recoveredText,
        numPages: 1,
        info: {},
        method: 'pdf-text-recovery'
      };
    }

    throw new Error(`Failed to parse PDF document: ${error.message}`);
  }
}
