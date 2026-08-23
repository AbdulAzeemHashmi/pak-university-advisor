"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { University } from "@/types";
import UniversityCard from "@/components/UniversityCard";
import AuthGuard from "@/components/AuthGuard";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShortlistClientContent() {
  const t = useTranslations("shortlist");
  const [shortlist, setShortlist] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shortlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.shortlist) {
          setShortlist(data.shortlist);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (id: string) => {
    setShortlist(shortlist.filter((u) => u.id !== id));
    fetch("/api/shortlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId: id })
    });
  };

  return (
    <AuthGuard>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="bg-[#01411C] text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#01411C] flex items-center justify-center font-bold shadow-md">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{t("title")}</h1>
            <p className="text-xs text-emerald-100/90 mt-0.5">{t("subtitle")}</p>
          </div>
        </div>

        {/* Shortlist Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#01411C]" />
          </div>
        ) : shortlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm my-8">
            <Heart className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">{t("empty")}</h2>
            <Link href="/universities">
              <Button className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-6 py-3 rounded-2xl font-bold text-xs mt-2">
                Browse Universities
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortlist.map((uni) => (
              <UniversityCard
                key={uni.id}
                university={uni}
                isShortlisted={true}
                onToggleShortlist={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
