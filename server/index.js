import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { extractTextFromPDF } from './services/pdfExtractor.js';
import { extractTextFromImage } from './services/ocrExtractor.js';
import { generateSummary } from './services/summarizer.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Configure Multer for file upload in memory
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
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max file size
  },
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
 * Route: Extract text from document (PDF or Image)
 */
app.post('/api/extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', message: 'Please attach a document file.' });
    }

    const file = req.file;
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    let result;
    const startTime = Date.now();

    if (isPDF) {
      result = await extractTextFromPDF(file.buffer);
    } else {
      result = await extractTextFromImage(file.buffer);
    }

    const processingTimeMs = Date.now() - startTime;

    if (!result.text || result.text.length < 5) {
      return res.status(422).json({
        error: 'Extraction Warning',
        message: 'Could not extract readable text from the uploaded file. Please ensure the document is clear and readable.',
        text: result.text || '',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        processingTimeMs
      });
    }

    res.json({
      success: true,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      text: result.text,
      numPages: result.numPages || 1,
      extractionMethod: result.method,
      confidence: result.confidence || null,
      processingTimeMs,
      stats: {
        characterCount: result.text.length,
        wordCount: result.text.trim().split(/\s+/).length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Route: Generate Summary from text
 */
app.post('/api/summarize', async (req, res, next) => {
  try {
    const { text, length = 'medium', customApiKey = '', userPrompt = '' } = req.body;

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
 * Convenience Route: Upload, Extract, and Summarize in one flow
 */
app.post('/api/process', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', message: 'Please attach a document file.' });
    }

    const { length = 'medium', customApiKey = '', userPrompt = '' } = req.body;
    const file = req.file;
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    const extractStartTime = Date.now();
    let extractResult;

    if (isPDF) {
      extractResult = await extractTextFromPDF(file.buffer);
    } else {
      extractResult = await extractTextFromImage(file.buffer);
    }
    const extractTimeMs = Date.now() - extractStartTime;

    const extractedText = extractResult.text || '';
    if (extractedText.length < 5) {
      return res.status(422).json({
        error: 'Extraction Failed',
        message: 'Could not extract sufficient text from the document to generate a summary.'
      });
    }

    const summarizeStartTime = Date.now();
    const summaryResult = await generateSummary(extractedText, length, customApiKey, userPrompt);
    const summarizeTimeMs = Date.now() - summarizeStartTime;

    res.json({
      success: true,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      extractionMethod: extractResult.method,
      extractedText,
      numPages: extractResult.numPages || 1,
      stats: {
        characterCount: extractedText.length,
        wordCount: extractedText.trim().split(/\s+/).length,
        extractTimeMs,
        summarizeTimeMs,
        totalTimeMs: extractTimeMs + summarizeTimeMs
      },
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      mainIdeas: summaryResult.mainIdeas,
      improvementSuggestions: summaryResult.improvementSuggestions,
      engine: summaryResult.engine,
      errorNote: summaryResult.errorNote || null
    });
  } catch (error) {
    next(error);
  }
});

// Serve frontend in production if built client directory exists
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Document Summary Assistant API Server. Frontend not built yet.');
    }
  });
});

// Attach Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
