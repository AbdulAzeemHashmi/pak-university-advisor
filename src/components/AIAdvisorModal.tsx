"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatPKR } from "@/lib/utils";
import { 
  Sparkles, 
  X, 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
  defaultDegree?: string;
  defaultBudget?: number;
}

export default function AIAdvisorModal({
  isOpen,
  onClose,
  defaultCity = "Lahore",
  defaultDegree = "Computer Science",
  defaultBudget = 300000
}: AIAdvisorModalProps) {
  const t = useTranslations("aiModal");

  const [budget, setBudget] = useState(defaultBudget);
  const [city, setCity] = useState(defaultCity);
  const [degree, setDegree] = useState(defaultDegree);
  const [academicMarks, setAcademicMarks] = useState("82% FSC Pre-Engineering");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);

    try {
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          location: city,
          degree,
          academicMarks
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error("AI recommend error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-emerald-800/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#01411C] to-[#1A8F3C] p-6 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#01411C] flex items-center justify-center font-bold shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <span>{t("title")}</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-medium">
                  Free OpenRouter AI
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-100 hover:text-white rounded-full hover:bg-emerald-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t("budgetLabel")}</label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  placeholder="e.g. 250000"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t("cityLabel")}</label>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore or Islamabad"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t("degreeLabel")}</label>
                <Input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t("academicLabel")}</label>
                <Input
                  type="text"
                  value={academicMarks}
                  onChange={(e) => setAcademicMarks(e.target.value)}
                  placeholder="e.g. 80% FSc Pre-Engineering"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#01411C] hover:bg-[#1A8F3C] text-white py-3 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{t("loading")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t("generateBtn")}</span>
                </>
              )}
            </Button>
          </form>

          {/* AI Response Output */}
          {recommendation && (
            <div className="bg-slate-50 border border-emerald-800/20 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#01411C] pb-2 border-b border-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Bilingual AI Counselor Guidance • انگریزی و اردو رہنمائی</span>
              </div>
              <div className="prose prose-sm text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
