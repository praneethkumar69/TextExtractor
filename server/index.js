import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { extractTextFromPDF } from './services/pdfExtractor.js';
import { isPDFFile } from './utils/fileHelpers.js';
import { generateSummary, generateSummaryFromImage } from './services/summarizer.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// File size constant — avoids magic numbers
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Configure Multer for in-memory file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|png|jpe?g|webp|bmp|tiff)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload a PDF or an image file (PNG, JPG, WEBP, BMP).'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Document Summary Assistant Backend'
  });
});

/**
 * Route: Standalone Summarization from text (used by UI re-summarize toolbar)
 */
app.post('/api/summarize', async (req, res, next) => {
  try {
    const { text = '', length = 'medium', customApiKey = '', userPrompt = '' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing text', message: 'Text content is required for summarization.' });
    }

    const summaryResult = await generateSummary(text, length, customApiKey, userPrompt);

    res.json({
      success: true,
      length,
      ...summaryResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: Upload document (PDF or Image), extract text, and generate AI summary in one unified flow.
 */
app.post('/api/process', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', message: 'Please attach a document file.' });
    }

    const {
      length = 'medium',
      customApiKey = '',
      userPrompt = ''
    } = req.body;

    // Sanitize and clamp client-extracted text to prevent prompt injection
    const clientExtractedText = String(req.body.clientExtractedText || '').trim().slice(0, 40000);

    const file = req.file;
    const processStartTime = Date.now();

    let extractedText = '';
    let extractionMethod = '';
    let summaryResult;

    if (isPDFFile(file)) {
      const extractResult = await extractTextFromPDF(file.buffer);
      extractedText = extractResult.text || '';
      extractionMethod = extractResult.method;

      if (extractedText.length < 5) {
        return res.status(422).json({
          error: 'Extraction Failed',
          message: 'Could not extract sufficient text from the PDF document to generate a summary.'
        });
      }

      summaryResult = await generateSummary(extractedText, length, customApiKey, userPrompt);
    } else {
      // Image file upload (PNG, JPG, WEBP, BMP, TIFF)
      if (clientExtractedText.length > 5) {
        // Use client-side browser OCR result when available (avoids serverless Tesseract issues)
        extractedText = clientExtractedText;
        extractionMethod = 'tesseract-ocr-client';
        summaryResult = await generateSummary(extractedText, length, customApiKey, userPrompt);
      } else {
        // Fall through to Gemini Vision multimodal API
        summaryResult = await generateSummaryFromImage(file.buffer, file.mimetype, length, customApiKey, userPrompt);
        extractedText = summaryResult.extractedText || '';
        extractionMethod = summaryResult.method || 'gemini-vision';
      }
    }

    const totalTimeMs = Date.now() - processStartTime;

    const safeWordCount = extractedText.trim()
      ? extractedText.trim().split(/\s+/).length
      : 0;

    res.json({
      success: true,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      length,
      extractionMethod,
      extractedText,
      numPages: 1,
      stats: {
        characterCount: extractedText.length,
        wordCount: safeWordCount,
        totalTimeMs
      },
      summary: summaryResult.summary || '',
      keyPoints: summaryResult.keyPoints || [],
      mainIdeas: summaryResult.mainIdeas || [],
      improvementSuggestions: summaryResult.improvementSuggestions || [],
      engine: summaryResult.engine || 'DocuMind Engine',
      isFallback: summaryResult.isFallback || false,
      errorNote: summaryResult.errorNote || null
    });
  } catch (error) {
    next(error);
  }
});

// Serve frontend in local production mode (outside Vercel)
if (!process.env.VERCEL) {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('Document Summary Assistant API Server.');
      }
    });
  });
}

// Attach Global Error Handler (must be last middleware)
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
