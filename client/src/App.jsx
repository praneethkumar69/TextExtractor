import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadBox from './components/UploadBox';
import SummaryControls from './components/SummaryControls';
import ProgressBar from './components/ProgressBar';
import ResultsView from './components/ResultsView';
import ApiKeyModal from './components/ApiKeyModal';
import { AlertTriangle, Sparkles, FileText, CheckCircle2, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [lengthOption, setLengthOption] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Status state: 'idle' | 'processing' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [currentStage, setCurrentStage] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [results, setResults] = useState(null);

  // Load API Key from localStorage if saved previously
  useEffect(() => {
    const savedKey = localStorage.getItem('docmind_gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('docmind_gemini_api_key', key);
    } else {
      localStorage.removeItem('docmind_gemini_api_key');
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setStatus('idle');
    setErrorMessage('');
    setResults(null);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) return;

    setStatus('processing');
    setCurrentStage(1);
    setErrorMessage('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('length', lengthOption);
      formData.append('userPrompt', customPrompt);
      if (apiKey) {
        formData.append('customApiKey', apiKey);
      }

      // Simulate stage 2 & 3 transitions for visual feedback
      setTimeout(() => setCurrentStage(2), 800);
      setTimeout(() => setCurrentStage(3), 2000);

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textBody = await response.text();
        throw new Error(
          response.ok
            ? 'Server returned an empty response.'
            : `Backend Server Error (${response.status}): ${textBody.slice(0, 150) || 'Connection failed'}`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to process document');
      }

      setResults(data);
      setStatus('success');
    } catch (err) {
      console.error('[Process Error]', err);
      setErrorMessage(err.message || 'An error occurred while processing the document.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus('idle');
    setResults(null);
    setErrorMessage('');
  };

  const isPDF = selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen flex flex-col bg-[#fafdfa] unthinkable-bg-grid text-slate-900 selection:bg-[#22c55e] selection:text-slate-950">
      
      {/* Navbar Header */}
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        apiKeyConfigured={!!apiKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Unthinkable Hero Header */}
        {status === 'idle' && !results && (
          <div className="text-center space-y-4 pt-4 pb-2 animate-fade-in max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unthinkable Document Intelligence Pipeline</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Turn Any Document Into <br className="hidden sm:block" />
              <span className="font-serif text-[#22c55e] italic font-normal">Unthinkable Insights</span>
            </h2>
            
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              Upload PDFs or scanned image documents. DocuMind parses structured layout text, performs OCR extraction, and generates smart summaries in seconds.
            </p>
          </div>
        )}

        {/* Processing State */}
        {status === 'processing' && (
          <ProgressBar currentStage={currentStage} isPDF={isPDF} />
        )}

        {/* Error State Banner */}
        {status === 'error' && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl flex items-start space-x-3.5 text-rose-900 animate-slide-up max-w-4xl mx-auto shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-950">Document Processing Error</h4>
              <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
              <button
                onClick={handleProcessDocument}
                className="mt-3 flex items-center space-x-1.5 text-xs font-bold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Processing</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Dashboard or Upload Controls */}
        {status === 'success' && results ? (
          <ResultsView data={results} onReset={handleReset} />
        ) : (
          <div className="space-y-8">
            <UploadBox
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              disabled={status === 'processing'}
            />

            <SummaryControls
              lengthOption={lengthOption}
              onLengthChange={setLengthOption}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              onProcess={handleProcessDocument}
              isLoading={status === 'processing'}
              disabled={!selectedFile}
            />
          </div>
        )}

        {/* Unthinkable Style "Trusted By" Partner Banner */}
        {status === 'idle' && !results && (
          <div className="pt-12 pb-6 border-t border-slate-200/60 space-y-6 text-center animate-fade-in">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Trusted By
            </p>
            <h3 className="text-2xl font-serif text-[#22c55e] font-normal">
              100+ Global Startups and Enterprises
            </h3>
            
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all pt-2">
              <span className="font-extrabold text-base tracking-tighter text-slate-800 font-mono">foodstories</span>
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-serif">VRX LABS</span>
              <span className="font-black text-sm tracking-widest text-slate-800 uppercase">LIBERTY LEATHERS</span>
              <span className="font-black text-xl tracking-tighter text-blue-600">olx</span>
              <span className="font-bold text-base text-rose-500 font-sans">CONTINUA</span>
            </div>
          </div>
        )}

      </main>

      {/* Unthinkable Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center space-x-2 font-bold text-slate-800">
            <span>unthinkable</span>
            <span className="text-[#22c55e]">DocuMind AI</span>
            <span>•</span>
            <span>Technical Assessment Project</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Powered by PDF-Parse, Tesseract OCR, & Google Gemini AI Engine
          </p>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
