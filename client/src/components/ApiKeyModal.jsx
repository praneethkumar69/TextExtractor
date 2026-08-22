import React, { useState } from 'react';
import { X, Key, Info, Check, ShieldCheck } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Key className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Gemini API Key Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
            />
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900 leading-relaxed">
            <Info className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Offline & Fallback Ready</p>
              <p className="mt-0.5 text-emerald-800">
                If no API key is set, DocuMind uses an intelligent built-in NLP engine to extract key takeaways and generate smart summaries out-of-the-box.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
              >
                Clear Key
              </button>
            )}
            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-[#22c55e] hover:bg-[#16a34a] rounded-xl transition-colors shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
