import React from 'react';
import { Upload, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProgressBar({ currentStage, isPDF }) {
  const stages = [
    { id: 1, label: 'Document Upload', icon: Upload },
    { id: 2, label: isPDF ? 'PDF Structure Extraction' : 'Tesseract OCR Recognition', icon: FileSearch },
    { id: 3, label: 'AI Summarization & Insights', icon: Sparkles },
  ];

  return (
    <div className="bg-white/90 border border-slate-200/90 rounded-3xl p-6 space-y-4 animate-fade-in shadow-card-soft max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
          <span>Processing Document Pipeline</span>
        </h3>
        <span className="text-xs text-emerald-700 font-mono font-bold">
          Stage {currentStage} of 3
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 transition-all duration-500 ease-out"
          style={{ width: `${(currentStage / 3) * 100}%` }}
        />
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isComplete = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                isCurrent
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20'
                  : isComplete
                  ? 'bg-green-50/70 border-green-200 text-green-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-[#22c55e] text-slate-950 font-bold animate-pulse'
                    : isComplete
                    ? 'bg-green-200 text-green-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{stage.label}</p>
                <p className="text-[10px] opacity-80">
                  {isComplete ? 'Completed' : isCurrent ? 'In progress...' : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
