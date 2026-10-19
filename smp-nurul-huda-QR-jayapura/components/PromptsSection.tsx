'use client';

import React, { useState } from 'react';
import { MODULAR_PROMPTS, ModularPrompt } from '@/lib/prompts-data';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  BookOpen, 
  CheckCircle2,
  FileText,
  Layers
} from 'lucide-react';

export const PromptsSection: React.FC = () => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(MODULAR_PROMPTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const activePrompt = MODULAR_PROMPTS.find(p => p.id === selectedPromptId) || MODULAR_PROMPTS[0];

  const handleCopyPrompt = (prompt: ModularPrompt) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    const combined = MODULAR_PROMPTS.map(p => 
      `### PROMPT ${p.nomor}: ${p.judul.toUpperCase()}\nKategori: ${p.kategori}\n\n${p.promptText}`
    ).join('\n\n========================================\n\n');

    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>{MODULAR_PROMPTS.length} Prompt Terpisah untuk Pembangunan Bertahap</span>
          </h2>
          <p className="text-xs text-slate-500">
            Prompt modular dengan spesifikasi presisi, tanpa rekayasa endpoint, dan siap disalin ke AI studio / LLM.
          </p>
        </div>

        <button
          onClick={handleCopyAllPrompts}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1.5 shadow-sm transition self-start sm:self-auto"
        >
          {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedAll ? `Semua ${MODULAR_PROMPTS.length} Prompt Tersalin!` : `Salin Seluruh ${MODULAR_PROMPTS.length} Prompt Sekaligus`}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation: List of 8 Prompts */}
        <div className="lg:col-span-4 space-y-2">
          {MODULAR_PROMPTS.map((prompt) => {
            const isSelected = prompt.id === selectedPromptId;
            return (
              <button
                key={prompt.id}
                onClick={() => setSelectedPromptId(prompt.id)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {prompt.nomor}
                    </span>
                    <span className="text-xs font-bold truncate">{prompt.judul}</span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    {prompt.kategori}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Preview Card: Full Prompt Text & Copy Button */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                  PROMPT #{activePrompt.nomor} • {activePrompt.kategori}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {activePrompt.judul}
              </h3>
              <p className="text-xs text-slate-500">{activePrompt.deskripsi}</p>
            </div>

            <button
              onClick={() => handleCopyPrompt(activePrompt)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 self-start sm:self-auto transition shadow-sm"
            >
              {copiedId === activePrompt.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Prompt Ini</span>
                </>
              )}
            </button>
          </div>

          {/* Prompt Body in formatted block */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {activePrompt.promptText}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Dapat langsung ditempel ke ChatGPT, Claude, atau Gemini.</span>
            <span>Spesifikasi Bahasa Indonesia Formal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
