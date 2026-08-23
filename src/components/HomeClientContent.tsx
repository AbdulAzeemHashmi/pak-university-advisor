"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { University } from "@/types";
import UniversityCard from "@/components/UniversityCard";
import AIAdvisorModal from "@/components/AIAdvisorModal";
import { 
  GraduationCap, 
  Search, 
  Sparkles, 
  Award, 
  CheckCircle, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeClientContentProps {
  featuredUnis: University[];
  totalUnis: number;
  scholarshipCount: number;
}

export default function HomeClientContent({
  featuredUnis,
  totalUnis,
  scholarshipCount
}: HomeClientContentProps) {
  const t = useTranslations("hero");
  const scholarshipT = useTranslations("scholarshipsPage");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/universities?searchQuery=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/universities");
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#01411C] via-[#0A5C2B] to-[#1A8F3C] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{t("badge")}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {t("title")}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-emerald-100/90 font-medium leading-relaxed">
            {t("subtitle")}
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleHeroSearch} className="pt-2 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-400/50"
              />
            </div>
            <Button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-[#01411C] font-extrabold px-8 py-4 rounded-2xl text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>{t("searchButton")}</span>
            </Button>
          </form>

          {/* AI Recommendation CTA */}
          <div className="pt-3 flex items-center gap-4">
            <Button
              onClick={() => setIsAiModalOpen(true)}
              variant="outline"
              className="bg-emerald-950/60 hover:bg-emerald-900 border-amber-400/50 text-amber-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t("aiRecommendBtn")}</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-emerald-700/50 relative z-10">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{totalUnis}+</div>
            <div className="text-xs text-emerald-100/80 font-medium">{t("stat1Label")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-300">60+</div>
            <div className="text-xs text-emerald-100/80 font-medium">{t("stat2Label")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-300">30+</div>
            <div className="text-xs text-emerald-100/80 font-medium">{t("stat3Label")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-300">PKR 0</div>
            <div className="text-xs text-emerald-100/80 font-medium">{t("stat4Label")}</div>
          </div>
        </div>
      </section>

      {/* Scholarship Spotlight Section */}
      <section className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 rounded-3xl p-8 border border-amber-400/30 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Financial Aid Portal • 100% Free Higher Education
            </span>
            <h2 className="text-2xl font-black text-slate-900">{scholarshipT("title")}</h2>
            <p className="text-xs text-slate-600 max-w-2xl">{scholarshipT("subtitle")}</p>
          </div>
          <Link
            href="/universities?maxFee=50000"
            className="inline-flex items-center gap-2 bg-[#01411C] text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md hover:bg-[#1A8F3C] transition-all"
          >
            <span>Explore Free Scholarship Unis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* HEC Card */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#01411C] flex items-center justify-center font-black">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{scholarshipT("hecTitle")}</h3>
                <span className="text-[11px] text-emerald-700 font-semibold">61 Public Sector Partner Institutions</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{scholarshipT("hecDesc")}</p>
          </div>

          {/* USAID Card */}
          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black">
                <Award className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{scholarshipT("usaidTitle")}</h3>
                <span className="text-[11px] text-blue-700 font-semibold">31 Partner Public & Private Institutions</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{scholarshipT("usaidDesc")}</p>
          </div>
        </div>
      </section>

      {/* Featured Universities Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Featured Universities</h2>
            <p className="text-xs text-slate-500">Top chartered higher education institutions across Pakistan</p>
          </div>
          <Link
            href="/universities"
            className="text-xs font-bold text-[#01411C] hover:text-[#1A8F3C] flex items-center gap-1"
          >
            <span>View All ({totalUnis})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredUnis.map((uni) => (
            <UniversityCard key={uni.id} university={uni} />
          ))}
        </div>
      </section>

      {/* AI Advisor Floating Modal */}
      <AIAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
