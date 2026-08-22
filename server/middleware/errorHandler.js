/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Multer specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File size limit exceeded',
      message: 'The uploaded file is too large. Maximum allowed size is 20MB.'
    });
  }

  if (err.message && err.message.includes('Unsupported file format')) {
    return res.status(400).json({
      error: 'Unsupported File Format',
      message: err.message
    });
  }

  // Default server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing your request.'
  });
};
