"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import AIAdvisorModal from "./AIAdvisorModal";

export default function RAGChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-gradient-to-r from-[#01411C] via-[#1A8F3C] to-[#01411C] text-white px-4 py-3.5 rounded-full shadow-2xl hover:shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-amber-400/30"
        aria-label="Ask RAG AI Counselor"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-[#01411C] flex items-center justify-center font-extrabold shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
          </span>
        </div>
        
        <div className="text-left hidden sm:block">
          <div className="text-xs font-black tracking-wide flex items-center gap-1">
            <span>RAG AI Advisor</span>
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
          </div>
          <div className="text-[10px] text-emerald-100/90 font-medium leading-none">
            Grounded Q&A • انگریزی و اردو
          </div>
        </div>
      </button>

      {/* RAG Counselor Modal */}
      <AIAdvisorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
