"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchFilters } from "@/types";
import { formatPKR } from "@/lib/utils";
import { 
  Search, 
  RotateCcw, 
  Building, 
  GraduationCap, 
  MapPin, 
  DollarSign,
  Bookmark,
  Wifi,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface FilterBarProps {
  cities: string[];
  programs: string[];
  categories?: string[];
  initialFilters?: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export default function FilterBar({
  cities,
  programs,
  categories = ["General", "Medical", "Engineering & Technology", "Agriculture & Veterinary", "Arts & Design"],
  initialFilters = {},
  onFilterChange
}: FilterBarProps) {
  const t = useTranslations("filters");

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [city, setCity] = useState(initialFilters.city || "all");
  const [degree, setDegree] = useState(initialFilters.degree || "all");
  const [category, setCategory] = useState(initialFilters.category || "all");
  const [type, setType] = useState<"Public" | "Private" | "all">(initialFilters.type || "all");
  const [distanceEducation, setDistanceEducation] = useState<boolean>(initialFilters.distanceEducation || false);
  const [maxFee, setMaxFee] = useState<number>(initialFilters.maxFee || 600000);

  const handleApply = () => {
    onFilterChange({
      searchQuery: searchQuery.trim() || undefined,
      city: city !== "all" ? city : undefined,
      degree: degree !== "all" ? degree : undefined,
      category: category !== "all" ? category : undefined,
      type: type !== "all" ? type : undefined,
      distanceEducation: distanceEducation ? true : undefined,
      maxFee,
      page: 1
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setCity("all");
    setDegree("all");
    setCategory("all");
    setType("all");
    setDistanceEducation(false);
    setMaxFee(600000);
    onFilterChange({
      page: 1
    });
  };

  const removeCity = () => { setCity("all"); onFilterChange({ searchQuery, city: undefined, degree, category, type, distanceEducation, maxFee, page: 1 }); };
  const removeDegree = () => { setDegree("all"); onFilterChange({ searchQuery, city, degree: undefined, category, type, distanceEducation, maxFee, page: 1 }); };
  const removeCategory = () => { setCategory("all"); onFilterChange({ searchQuery, city, degree, category: undefined, type, distanceEducation, maxFee, page: 1 }); };
  const removeType = () => { setType("all"); onFilterChange({ searchQuery, city, degree, category, type: undefined, distanceEducation, maxFee, page: 1 }); };
  const removeDistanceEdu = () => { setDistanceEducation(false); onFilterChange({ searchQuery, city, degree, category, type, distanceEducation: undefined, maxFee, page: 1 }); };
  const removeSearchQuery = () => { setSearchQuery(""); onFilterChange({ searchQuery: undefined, city, degree, category, type, distanceEducation, maxFee, page: 1 }); };

  const hasActiveFilters = searchQuery || city !== "all" || degree !== "all" || category !== "all" || type !== "all" || distanceEducation;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
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

        {/* Category Specialization Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#01411C]" />
            <span>Category</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01411C]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
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

      {/* Distance Education Toggle & Max Fee Slider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100 items-center">
        {/* Max Fee Slider */}
        <div className="md:col-span-2 space-y-2">
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

        {/* Distance Education Checkbox */}
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={distanceEducation}
              onChange={(e) => setDistanceEducation(e.target.checked)}
              className="w-4 h-4 rounded text-[#01411C] focus:ring-[#01411C]"
            />
            <Wifi className="w-4 h-4 text-purple-600" />
            <span>Distance Education Only</span>
          </label>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase">Active Tags:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
              "{searchQuery}"
              <button onClick={removeSearchQuery} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {city !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
              City: {city}
              <button onClick={removeCity} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {degree !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
              Degree: {degree}
              <button onClick={removeDegree} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {category !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
              Category: {category}
              <button onClick={removeCategory} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {type !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
              Sector: {type}
              <button onClick={removeType} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {distanceEducation && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-semibold">
              Distance Education
              <button onClick={removeDistanceEdu} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

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
