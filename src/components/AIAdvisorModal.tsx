"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { University } from "@/types";
import UniversityDetailModal from "./UniversityDetailModal";
import { formatPKR } from "@/lib/utils";
import { 
  Sparkles, 
  X, 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle2, 
  RotateCcw,
  Building2,
  MapPin,
  Award,
  ExternalLink,
  ChevronRight,
  User,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedUniversities?: University[];
  timestamp: string;
}

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
  defaultDegree?: string;
  defaultBudget?: number;
}

const PRESET_PROMPTS = [
  { label: "🎓 Low cost CS in Lahore under 2.5 Lakh", query: "Suggest low fee private and public universities for Computer Science in Lahore under 250000 PKR." },
  { label: "💰 HEC Need-Based Scholarships in Punjab", query: "Which universities in Punjab offer 100% HEC Need-Based Scholarships?" },
  { label: "🏛️ FAST vs NUST comparison", query: "Compare FAST NUCES and NUST Islamabad for Computer Science and Software Engineering." },
  { label: "🩺 Medical & Nursing colleges in KPK", query: "What are the top public and private medical or health science universities in Khyber Pakhtunkhwa?" }
];

export default function AIAdvisorModal({
  isOpen,
  onClose,
  defaultCity = "Lahore",
  defaultDegree = "Computer Science"
}: AIAdvisorModalProps) {
  const t = useTranslations("aiModal");

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: `السلام علیکم! I am your Pak University RAG AI Counselor.\n\nAsk me any question in English, Urdu (اردو), or Roman Urdu about Pakistani universities, tuition fees, HEC/USAID scholarships, or degree programs.\n\nRecommendations are based on retrieved local records. Please confirm changing fees, admissions, and scholarship terms on official websites.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedUniForDetail, setSelectedUniForDetail] = useState<University | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMessage("");
    setLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.recommendation,
          citedUniversities: data.citedUniversities || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errData = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Sorry, an error occurred: ${errData.error || "Unable to retrieve response."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      console.error("RAG chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, network or server connection failed. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-msg-reset",
        role: "assistant",
        content: `Chat history reset. How else can I assist your university search today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-3xl h-[88vh] flex flex-col shadow-2xl border border-emerald-800/20 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#01411C] via-[#1A8F3C] to-[#01411C] p-4 sm:p-5 text-white flex items-center justify-between relative shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#01411C] flex items-center justify-center font-extrabold shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base sm:text-lg text-white">
                    RAG AI University Counselor
                  </h2>
                  <span className="text-[10px] bg-amber-400 text-[#01411C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 fill-[#01411C]" />
                    Grounded RAG
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium">
                  Instant Fact-Grounded Admissions & Scholarship Q&A • انگریزی و اردو
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleResetChat}
                title="Reset Chat"
                className="p-2 text-emerald-100 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-emerald-100 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Preset Prompts Bar */}
          <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 overflow-x-auto flex items-center gap-2 text-xs scrollbar-none">
            <div className="flex items-center gap-1 text-[#01411C] font-extrabold whitespace-nowrap text-[11px] mr-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Try asking:</span>
            </div>
            {PRESET_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.query)}
                disabled={loading}
                className="whitespace-nowrap bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#01411C] border border-slate-200 hover:border-emerald-300 px-3 py-1 rounded-full text-[11px] font-medium transition-all shadow-xs"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef}
            className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-[#01411C] text-amber-300"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble & Contents */}
                <div className="space-y-3">
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-[#01411C] text-white rounded-tr-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    <div
                      className={`text-[10px] mt-2 text-right ${
                        msg.role === "user" ? "text-emerald-200/70" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Cited Interactive University Cards (If any) */}
                  {msg.citedUniversities && msg.citedUniversities.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#01411C]">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                          Retrieved database records ({msg.citedUniversities.length} institutions)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citedUniversities.map((uni) => (
                          <div
                            key={uni.id}
                            className="bg-white rounded-xl p-3 border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                  {uni.name}
                                </h4>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                    uni.type === "Public"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {uni.type}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {uni.city}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-emerald-700">
                                  PKR {uni.fee_range_max.toLocaleString()}/yr
                                </span>
                              </div>

                              {(uni.has_hec_scholarship || uni.has_usaid_scholarship) && (
                                <div className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                  <Award className="w-2.5 h-2.5 text-amber-600" />
                                  <span>{uni.has_hec_scholarship ? "HEC Waiver" : "USAID Grant"}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedUniForDetail(uni)}
                              className="mt-2.5 w-full bg-slate-100 hover:bg-[#01411C] text-slate-700 hover:text-white py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>View Details & Programs</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 mr-auto max-w-[80%] items-center">
                <div className="w-8 h-8 rounded-full bg-[#01411C] text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-[#01411C]" />
                  <span>Searching vector index & formatting fact-grounded response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask in English or Urdu (e.g. Lowest fee CS in Lahore with scholarship)..."
                disabled={loading}
                className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 focus:border-emerald-600 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none transition-all"
              />
              <Button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <>
                    <span>Ask RAG</span>
                    <Send className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </Button>
            </form>
          </div>

        </div>
      </div>

      {/* University Detail Modal Popup when clicked from RAG citation cards */}
      {selectedUniForDetail && (
        <UniversityDetailModal
          university={selectedUniForDetail}
          isOpen={!!selectedUniForDetail}
          onClose={() => setSelectedUniForDetail(null)}
        />
      )}
    </>
  );
}
