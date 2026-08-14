/**
 * Global Error Handler Middleware
 * Sanitizes error messages in production to prevent internal stack trace leaks.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the full error server-side (never expose to client)
  console.error('[Error Handler]', err.name, err.message);

  // Multer file size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File Size Limit Exceeded',
      message: 'The uploaded file is too large. Maximum allowed size is 20MB.'
    });
  }

  // Multer unsupported MIME type
  if (err.message && err.message.includes('Unsupported file format')) {
    return res.status(400).json({
      error: 'Unsupported File Format',
      message: err.message
    });
  }

  // CORS violation
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Cross-origin request not permitted.'
    });
  }

  // Default server error — hide internal details in production
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: isProduction
      ? 'An unexpected error occurred. Please try again.'
      : (err.message || 'An unexpected error occurred while processing your request.')
  });
};
