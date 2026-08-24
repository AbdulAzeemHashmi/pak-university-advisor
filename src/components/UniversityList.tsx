"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { University, PaginatedResult } from "@/types";
import UniversityCard from "./UniversityCard";
import ScholarshipBadge from "./ScholarshipBadge";
import UniversityDetailModal from "./UniversityDetailModal";
import { formatPKR } from "@/lib/utils";
import { 
  Award, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Sparkles,
  LayoutGrid,
  List,
  Info
} from "lucide-react";

interface UniversityListProps {
  data: PaginatedResult<University>;
  shortlistedIds?: string[];
  comparedIds?: string[];
  onPageChange: (page: number) => void;
  onToggleShortlist?: (id: string) => void;
  onToggleCompare?: (university: University) => void;
  maxFeeFilter?: number;
}

export default function UniversityList({
  data,
  shortlistedIds = [],
  comparedIds = [],
  onPageChange,
  onToggleShortlist,
  onToggleCompare,
  maxFeeFilter
}: UniversityListProps) {
  const t = useTranslations("card");
  const fallbackT = useTranslations("fallback");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const { results, pagination, scholarshipOptions } = data;

  // Case 1: Smart Fallback Logic (No universities fit budget)
  if (results.length === 0 && scholarshipOptions && scholarshipOptions.length > 0) {
    return (
      <div className="space-y-6">
        {/* Banner Alert */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Award className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-100">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Smart Scholarship Fallback • تعلیمی وظائف</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              {fallbackT("title", { maxFee: formatPKR(maxFeeFilter || 0) })}
            </h2>
            <p className="text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              {fallbackT("subtitle")}
            </p>
          </div>
        </div>

        {/* List of Recommended Scholarship Universities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scholarshipOptions.map((uni) => (
            <div key={uni.id} className="bg-white rounded-2xl p-6 border border-emerald-800/20 shadow-md hover:shadow-lg transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{uni.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{uni.city}, {uni.province} • {uni.type} Sector</p>
                </div>
                <ScholarshipBadge hasHec={uni.has_hec_scholarship} hasUsaid={uni.has_usaid_scholarship} />
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200/60 text-xs text-emerald-950 space-y-1">
                <p className="font-bold text-emerald-900">{fallbackT("details")}:</p>
                <p className="leading-relaxed">{uni.scholarship_details || "Full tuition fee waiver, monthly stipend & books allowance for deserving students."}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#01411C]" />
                  {fallbackT("financialAidContact")}:
                </span>
                <button
                  onClick={() => setSelectedUni(uni)}
                  className="inline-flex items-center gap-1 font-bold text-[#01411C] hover:text-[#1A8F3C]"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>View Details & Map</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <UniversityDetailModal
          university={selectedUni}
          isOpen={!!selectedUni}
          onClose={() => setSelectedUni(null)}
        />
      </div>
    );
  }

  // Case 2: No results at all
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm">
        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Universities Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Try expanding your search query, increasing your maximum fee budget, or selecting a different city.
        </p>
      </div>
    );
  }

  // Case 3: Display results
  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>Showing {results.length} of {pagination.total} universities</span>
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-[#01411C] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-[#01411C] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid or List View */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-4"
      }>
        {results.map((uni) => (
          <UniversityCard
            key={uni.id}
            university={uni}
            isShortlisted={shortlistedIds.includes(uni.id)}
            isCompared={comparedIds.includes(uni.id)}
            onToggleShortlist={onToggleShortlist}
            onToggleCompare={onToggleCompare}
            onViewDetails={(u) => setSelectedUni(u)}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-slate-700 px-4 py-2 bg-slate-100 rounded-xl">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <UniversityDetailModal
        university={selectedUni}
        isOpen={!!selectedUni}
        onClose={() => setSelectedUni(null)}
      />
    </div>
  );
}
