"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchFilters } from "@/types";
import { formatPKR } from "@/lib/utils";
import { Search, Filter, RotateCcw, Building, GraduationCap, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface FilterBarProps {
  cities: string[];
  programs: string[];
  initialFilters?: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export default function FilterBar({
  cities,
  programs,
  initialFilters = {},
  onFilterChange
}: FilterBarProps) {
  const t = useTranslations("filters");

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [city, setCity] = useState(initialFilters.city || "all");
  const [degree, setDegree] = useState(initialFilters.degree || "all");
  const [type, setType] = useState(initialFilters.type || "all");
  const [maxFee, setMaxFee] = useState<number>(initialFilters.maxFee || 600000);

  const handleApply = () => {
    onFilterChange({
      searchQuery: searchQuery.trim() || undefined,
      city: city !== "all" ? city : undefined,
      degree: degree !== "all" ? degree : undefined,
      type: type !== "all" ? (type as "Public" | "Private") : undefined,
      maxFee,
      page: 1
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setCity("all");
    setDegree("all");
    setType("all");
    setMaxFee(600000);
    onFilterChange({
      page: 1
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-900/10 space-y-6 relative overflow-hidden">
      {/* Top Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder={t("title") + "..."}
            className="pl-12 pr-4 py-3 rounded-2xl border-slate-200 focus:border-[#01411C] focus:ring-[#01411C] text-sm shadow-sm"
          />
        </div>
        <Button
          onClick={handleApply}
          className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">{t("apply")}</span>
        </Button>
      </div>

      {/* Grid of dropdown filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        {/* City Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#01411C]" />
            <span>{t("city")}</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01411C]"
          >
            <option value="all">{t("allCities")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Degree Program Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#01411C]" />
            <span>{t("degree")}</span>
          </label>
          <select
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01411C]"
          >
            <option value="all">{t("allDegrees")}</option>
            {programs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Sector Type Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#01411C]" />
            <span>{t("type")}</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Public" | "Private" | "all")}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01411C]"
          >
            <option value="all">{t("allTypes")}</option>
            <option value="Public">{t("public")}</option>
            <option value="Private">{t("private")}</option>
          </select>
        </div>
      </div>

      {/* Max Fee Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#01411C]" />
            <span>{t("maxFee")}</span>
          </label>
          <span className="text-xs font-extrabold text-[#01411C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {formatPKR(maxFee)} / yr
          </span>
        </div>
        <Slider
          value={maxFee}
          min={30000}
          max={1200000}
          step={20000}
          onValueChange={(val) => setMaxFee(val)}
        />
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span>PKR 30,000</span>
          <span>PKR 600,000</span>
          <span>PKR 1,200,000+</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("reset")}</span>
        </button>
        <Button
          onClick={handleApply}
          size="sm"
          className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
        >
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}
