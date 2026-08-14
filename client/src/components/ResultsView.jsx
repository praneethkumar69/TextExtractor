import React, { useState, useEffect } from 'react';
import {
  FileText,
  ListChecks,
  Lightbulb,
  Code,
  Copy,
  Check,
  Download,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  Search,
  BookOpen,
  Sliders,
  RefreshCw,
  Target
} from 'lucide-react';

export default function ResultsView({ data, apiKey, onReset }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive re-summarize state
  const [summaryData, setSummaryData] = useState(data);
  const [selectedLength, setSelectedLength] = useState(data.length || 'medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isResummarizing, setIsResummarizing] = useState(false);
  const [resummarizeError, setResummarizeError] = useState('');

  // Sync state if external data prop changes
  useEffect(() => {
    setSummaryData(data);
    setSelectedLength(data.length || 'medium');
  }, [data]);

  if (!summaryData) return null;

  const {
    fileName,
    fileSize,
    extractionMethod,
    extractedText,
    numPages,
    stats,
    summary,
    keyPoints = [],
    mainIdeas = [],
    improvementSuggestions = [],
    engine,
    errorNote
  } = summaryData;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleCopyText = () => {
    const textToCopy = activeTab === 'summary' ? summary : extractedText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResummarize = async (targetLength, promptText) => {
    setIsResummarizing(true);
    setResummarizeError('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: extractedText,
          length: targetLength,
          customApiKey: apiKey || '',
          userPrompt: promptText || ''
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Failed to re-summarize document');
      }

      setSummaryData((prev) => ({
        ...prev,
        summary: resData.summary,
        keyPoints: resData.keyPoints || [],
        mainIdeas: resData.mainIdeas || [],
        improvementSuggestions: resData.improvementSuggestions || [],
        engine: resData.engine,
        errorNote: resData.errorNote || null
      }));
      setSelectedLength(targetLength);
    } catch (err) {
      console.error('[Re-summarize Error]', err);
      setResummarizeError(err.message || 'Error generating new summary.');
    } finally {
      setIsResummarizing(false);
    }
  };

  const handleLengthChange = (newLength) => {
    if (newLength === selectedLength && !customPrompt) return;
    setSelectedLength(newLength);
    handleResummarize(newLength, customPrompt);
  };

  const handleDownloadTXT = () => {
    let txtContent = `==================================================\n`;
    txtContent += `DOCUMIND EXTRACTED DOCUMENT REPORT\n`;
    txtContent += `==================================================\n`;
    txtContent += `File Name: ${fileName}\n`;
    txtContent += `File Size: ${formatFileSize(fileSize)}\n`;
    txtContent += `Pages: ${numPages || 1}\n`;
    txtContent += `Word Count: ${stats?.wordCount || 0} words\n`;
    txtContent += `Character Count: ${stats?.characterCount || 0} characters\n`;
    txtContent += `Extraction Method: ${extractionMethod === 'pdf-parse' ? 'PDF Parsing (Formatting Maintained)' : 'Tesseract OCR'}\n`;
    txtContent += `Engine Used: ${engine || 'DocuMind Engine'}\n`;
    txtContent += `Summary Length: ${selectedLength.toUpperCase()}\n`;
    txtContent += `==================================================\n\n`;

    if (summary) {
      txtContent += `--- EXECUTIVE SUMMARY (${selectedLength.toUpperCase()}) ---\n\n`;
      txtContent += `${summary}\n\n`;
    }

    if (mainIdeas.length > 0) {
      txtContent += `--- MAIN IDEAS & CORE THEMES ---\n`;
      mainIdeas.forEach((mi, idx) => {
        txtContent += `${idx + 1}. ${mi}\n`;
      });
      txtContent += `\n`;
    }

    if (keyPoints.length > 0) {
      txtContent += `--- KEY POINTS & TAKEAWAYS ---\n`;
      keyPoints.forEach((kp, idx) => {
        txtContent += `${idx + 1}. ${kp}\n`;
      });
      txtContent += `\n`;
    }

    if (improvementSuggestions.length > 0) {
      txtContent += `--- DOCUMENT IMPROVEMENT SUGGESTIONS ---\n`;
      improvementSuggestions.forEach((sug, idx) => {
        txtContent += `* ${sug}\n`;
      });
      txtContent += `\n`;
    }

    txtContent += `--- EXTRACTED TEXT (FORMATTING MAINTAINED) ---\n\n`;
    txtContent += `${extractedText}\n\n`;

    txtContent += `==================================================\n`;
    txtContent += `Generated by DocuMind Assistant\n`;
    txtContent += `==================================================\n`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRawText = searchQuery
    ? extractedText.split('\n').filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase())).join('\n')
    : extractedText;

  const tabs = [
    { id: 'summary', label: 'Executive Summary', icon: BookOpen, count: null },
    { id: 'keyPoints', label: 'Key Points', icon: ListChecks, count: keyPoints.length },
    { id: 'mainIdeas', label: 'Main Ideas', icon: Zap, count: mainIdeas.length },
    { id: 'rawText', label: 'Extracted Text (PDF / OCR)', icon: FileText, count: null },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, count: improvementSuggestions.length },
    { id: 'json', label: 'JSON Data', icon: Code, count: null }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-up">
      
      {/* Top Metadata Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 truncate max-w-md">{fileName}</h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  {extractionMethod === 'pdf-parse' ? 'PDF Parsed' : 'Tesseract OCR'}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white uppercase">
                  {selectedLength} Summary
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                <span>{formatFileSize(fileSize)}</span>
                <span>•</span>
                <span>{stats?.wordCount || 0} words</span>
                <span>•</span>
                <span>{stats?.characterCount || 0} characters</span>
                <span>•</span>
                <span>Engine: {engine || 'DocuMind Engine'}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadTXT}
              className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 transition-colors shadow-md shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download .TXT</span>
            </button>

            <button
              onClick={onReset}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors"
              title="Upload New Document"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorNote && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorNote}</span>
          </div>
        )}

        {resummarizeError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{resummarizeError}</span>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-card-soft">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#22c55e] text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display Area */}
        <div className="p-7">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Interactive Summary Length Selector Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800">Summary Length:</span>
                  <div className="inline-flex rounded-xl bg-slate-200/80 p-1 border border-slate-300/60">
                    {[
                      { id: 'short', label: 'Short' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'long', label: 'Long' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleLengthChange(opt.id)}
                        disabled={isResummarizing}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          selectedLength === opt.id
                            ? 'bg-[#22c55e] text-slate-950 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Custom directive / focus area..."
                    className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full sm:w-56"
                  />
                  <button
                    onClick={() => handleResummarize(selectedLength, customPrompt)}
                    disabled={isResummarizing}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5"
                  >
                    {isResummarizing ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{isResummarizing ? 'Updating...' : 'Update'}</span>
                  </button>
                </div>
              </div>

              {/* Main Ideas Highlight Card Grid */}
              {mainIdeas.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Highlighted Main Ideas</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mainIdeas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-xs font-medium text-emerald-950 flex items-start space-x-2.5 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-lg bg-emerald-600 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{idea}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Text Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Cohesive Summary Text ({selectedLength.toUpperCase()})</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    {summary ? summary.split(/\s+/).length : 0} words
                  </span>
                </div>

                {isResummarizing ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-7 h-7 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Generating smart {selectedLength} summary...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line font-sans p-5 bg-slate-50/60 rounded-2xl border border-slate-200/70">
                    {summary || <span className="text-slate-400 italic">No summary generated.</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KEY POINTS */}
          {activeTab === 'keyPoints' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <ListChecks className="w-4.5 h-4.5 text-emerald-600" />
                <span>Highlighted Key Points & Main Takeaways ({keyPoints.length})</span>
              </h3>
              
              {keyPoints.length > 0 ? (
                <ul className="space-y-3">
                  {keyPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3.5 text-xs text-slate-800 leading-relaxed shadow-xs"
                    >
                      <span className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No key points extracted.</p>
              )}
            </div>
          )}

          {/* TAB 3: MAIN IDEAS */}
          {activeTab === 'mainIdeas' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Zap className="w-4.5 h-4.5 text-emerald-600" />
                <span>Core Main Ideas & Document Themes ({mainIdeas.length})</span>
              </h3>
              
              {mainIdeas.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {mainIdeas.map((idea, idx) => (
                    <div
                      key={idx}
                      className="p-4.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start space-x-3.5 text-xs text-emerald-950 leading-relaxed shadow-xs"
                    >
                      <Target className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-900">Main Idea {idx + 1}: </span>
                        <span>{idea}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No main ideas identified.</p>
              )}
            </div>
          )}

          {/* TAB 4: EXTRACTED TEXT (PDF Parsing / Tesseract OCR) */}
          {activeTab === 'rawText' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Extracted Text (Formatting Preserved)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extracted via {extractionMethod === 'pdf-parse' ? 'PDF Parsing (preserving layout)' : 'Tesseract Optical Character Recognition (OCR)'}
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in text..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Formatting Preserved Box */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 min-h-[250px] max-h-[500px] overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {filteredRawText || <span className="text-slate-400 italic">No text matching search query.</span>}
              </div>
            </div>
          )}

          {/* TAB 5: IMPROVEMENT SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                <span>Document Improvement Suggestions ({improvementSuggestions.length})</span>
              </h3>
              
              {improvementSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {improvementSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-4.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start space-x-3.5 text-xs text-amber-950 leading-relaxed"
                    >
                      <Lightbulb className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900">Recommendation {idx + 1}: </span>
                        <span>{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No improvement suggestions derived.</p>
              )}
            </div>
          )}

          {/* TAB 6: JSON DATA */}
          {activeTab === 'json' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Code className="w-4.5 h-4.5 text-blue-600" />
                <span>Raw Response JSON Payload</span>
              </h3>
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(summaryData, null, 2)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
