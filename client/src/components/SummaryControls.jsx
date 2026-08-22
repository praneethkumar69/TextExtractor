import React from 'react';
import { Sliders, Sparkles, Send } from 'lucide-react';

export default function SummaryControls({
  lengthOption,
  onLengthChange,
  customPrompt,
  onCustomPromptChange,
  onProcess,
  isLoading,
  disabled
}) {
  const options = [
    {
      id: 'short',
      label: 'Short',
      desc: '1-2 Paragraphs (~100 words)',
      badge: 'Executive'
    },
    {
      id: 'medium',
      label: 'Medium',
      desc: '3-4 Paragraphs (~250 words)',
      badge: 'Recommended'
    },
    {
      id: 'long',
      label: 'Long',
      desc: 'Detailed Breakdown (~500 words)',
      badge: 'In-Depth'
    }
  ];

  return (
    <div className="bg-white/90 border border-slate-200/90 rounded-3xl p-6 shadow-card-soft space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Summarization Configuration</h2>
        </div>
      </div>

      {/* Summary Length Options */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2.5">
          Select Summary Depth & Length
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {options.map((opt) => {
            const isSelected = lengthOption === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onLengthChange(opt.id)}
                disabled={disabled}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-50/90 border-[#22c55e] text-slate-900 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">{opt.label}</span>
                  {isSelected && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#22c55e] text-slate-950">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Focus */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Custom Focus / Special Directives (Optional)
        </label>
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Focus on financial metrics, risk factors, or action items..."
          className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
        />
      </div>

      {/* Action CTA Button */}
      <button
        type="button"
        onClick={onProcess}
        disabled={disabled || isLoading}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm text-slate-950 flex items-center justify-center space-x-2.5 transition-all duration-200 shadow-xl ${
          disabled || isLoading
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
            : 'bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.99]'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            <span>Processing Unthinkable Summary...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4.5 h-4.5" />
            <span>Generate Smart Summary & Key Insights</span>
          </>
        )}
      </button>
    </div>
  );
}
