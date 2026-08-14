import React from 'react';
import { Flag, Key, CheckCircle2, Github } from 'lucide-react';

export default function Header({ onOpenApiKeyModal, apiKeyConfigured }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo matching Unthinkable style */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 cursor-pointer group">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-sans">
              unthinkable
            </span>
            <div className="w-5 h-5 rounded-md bg-[#22c55e] flex items-center justify-center text-slate-950 transform rotate-12 group-hover:rotate-0 transition-transform">
              <Flag className="w-3 h-3 fill-current" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ml-1.5">
              DocuMind AI
            </span>
          </div>
        </div>

        {/* Right CTA Button & GitHub */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md ${
              apiKeyConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{apiKeyConfigured ? 'API Key Active' : 'Set Gemini Key'}</span>
            {apiKeyConfigured && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />}
          </button>

          <a
            href="https://github.com/praneethkumar69/TextExtractor"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-4.5 h-4.5" />
          </a>
        </div>

      </div>
    </header>
  );
}
