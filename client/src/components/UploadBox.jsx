import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function UploadBox({ selectedFile, onFileSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'];

  const validateAndPassFile = (file) => {
    setErrorMessage('');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported format (.${ext}). Please upload a PDF or image file (PNG, JPG, WEBP).`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum 20MB limit.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isPDF = selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Large Rectangular Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center transition-all duration-300 ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : ''
        } ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01] ring-4 ring-emerald-500/10'
            : selectedFile
            ? 'border-emerald-500/70 bg-emerald-50/40 shadow-card-soft'
            : 'border-slate-300 hover:border-emerald-500/80 bg-white/90 hover:bg-slate-50/80 shadow-card-soft'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
          disabled={disabled}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-md">
              {isPDF ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2 text-base font-extrabold text-slate-900">
                <span>{selectedFile.name}</span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {formatFileSize(selectedFile.size)} • {isPDF ? 'PDF Document' : 'Image File (OCR Target)'}
              </p>
            </div>
            {!disabled && (
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Click or drop another file to replace</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-100 transition-all shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900">
                Drag & drop your document here, or <span className="text-emerald-600 underline underline-offset-4">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Supports PDF & Scanned Images (PNG, JPG, WEBP, BMP) up to 20MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-xs text-rose-700 animate-slide-up">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
}
