"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { University } from "@/types";
import { Badge } from "@/components/ui/badge";
import ScholarshipBadge from "./ScholarshipBadge";
import { formatPKR } from "@/lib/utils";
import { 
  MapPin, 
  Calendar, 
  Trophy, 
  ExternalLink, 
  Heart, 
  CheckSquare, 
  Square,
  Building2,
  Info,
  Wifi
} from "lucide-react";

interface UniversityCardProps {
  university: University;
  isShortlisted?: boolean;
  isCompared?: boolean;
  onToggleShortlist?: (id: string) => void;
  onToggleCompare?: (university: University) => void;
  onViewDetails?: (university: University) => void;
}

export default function UniversityCard({
  university,
  isShortlisted = false,
  isCompared = false,
  onToggleShortlist,
  onToggleCompare,
  onViewDetails
}: UniversityCardProps) {
  const t = useTranslations("card");
  const [shortlisted, setShortlisted] = useState(isShortlisted);
  const [compared, setCompared] = useState(isCompared);

  const handleShortlistClick = () => {
    setShortlisted(!shortlisted);
    if (onToggleShortlist) {
      onToggleShortlist(university.id);
    }
  };

  const handleCompareClick = () => {
    setCompared(!compared);
    if (onToggleCompare) {
      onToggleCompare(university);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-700/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Banner Image or Gradient */}
      <div className="h-32 bg-gradient-to-r from-[#01411C] to-[#1A8F3C] relative overflow-hidden flex items-end p-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Floating Badges */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
          <Badge variant={university.type === "Public" ? "default" : "secondary"} className="shadow-md">
            {university.type === "Public" ? t("publicBadge") : t("privateBadge")}
          </Badge>
          {university.distance_education && (
            <Badge variant="secondary" className="bg-purple-900/60 text-purple-200 text-[10px] shadow-sm">
              <Wifi className="w-2.5 h-2.5 mr-0.5" /> Distance Edu
            </Badge>
          )}
        </div>

        {/* Shortlist Heart Button */}
        <button
          onClick={handleShortlistClick}
          className={`
            absolute top-3 left-3 z-10 w-9 h-9 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-md backdrop-blur-md
            ${shortlisted 
              ? "bg-red-500 text-white scale-110" 
              : "bg-white/80 text-slate-600 hover:bg-white hover:text-red-500"
            }
          `}
          title={t("saveShortlist")}
        >
          <Heart className={`w-5 h-5 ${shortlisted ? "fill-current" : ""}`} />
        </button>

        {/* University Name Header */}
        <div className="relative z-10 text-white w-full">
          <h3 className="font-bold text-lg leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors">
            {university.name}
          </h3>
          <p className="text-xs text-emerald-100/90 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-300 flex-shrink-0" />
            <span>{university.city}, {university.province}</span>
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Metadata Row: Established & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
            {university.established_year ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {t("established", { year: university.established_year })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {university.category || "General"}
              </span>
            )}

            {university.ranking ? (
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Rank #{university.ranking}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {university.category || "General"}
              </span>
            )}
          </div>

          {/* Scholarship Badges */}
          <div className="mb-3">
            <ScholarshipBadge 
              hasHec={university.has_hec_scholarship} 
              hasUsaid={university.has_usaid_scholarship} 
            />
          </div>

          {/* Key Degree Programs Tags */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Offerings</span>
            <div className="flex flex-wrap gap-1">
              {university.programs && university.programs.slice(0, 4).map((prog, idx) => (
                <span 
                  key={idx} 
                  className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                >
                  {prog}
                </span>
              ))}
              {university.programs && university.programs.length > 4 && (
                <span className="text-[11px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-md">
                  +{university.programs.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: Fee Structure & Action buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500">{t("annualFee")}</span>
            <span className="text-sm font-extrabold text-[#01411C]">
              {formatPKR(university.fee_range_max)} <span className="text-[10px] font-normal text-slate-500">/ yr</span>
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {/* View Details & Map button */}
            <button
              onClick={() => onViewDetails && onViewDetails(university)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#01411C] hover:bg-[#1A8F3C] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Info className="w-3.5 h-3.5 text-amber-300" />
              <span>Details & Map</span>
            </button>

            {/* Compare toggle */}
            <button
              onClick={handleCompareClick}
              className={`
                flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold
                transition-all border
                ${compared 
                  ? "bg-amber-50 border-amber-400 text-amber-900" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }
              `}
              title={t("addToCompare")}
            >
              {compared ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Visit Official Site link */}
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-emerald-50 text-[#01411C] hover:bg-[#01411C] hover:text-white transition-colors border border-emerald-200/60"
                title="Visit Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
