/**
 * Determines if a Multer file object represents a PDF document.
 * Checks both MIME type and file extension to handle edge cases.
 * @param {import('multer').File} file - The Multer file object
 * @returns {boolean}
 */
export function isPDFFile(file) {
  return (
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  );
}
