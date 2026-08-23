"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { University } from "@/types";
import { formatPKR } from "@/lib/utils";
import ScholarshipBadge from "./ScholarshipBadge";
import { 
  GitCompare, 
  Trash2, 
  Plus, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Trophy, 
  GraduationCap, 
  Award, 
  Phone 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareClientContent() {
  const t = useTranslations("compare");
  const [comparedList, setComparedList] = useState<University[]>([]);

  useEffect(() => {
    // Load default initial items for demonstration
    fetch("/api/universities?limit=3")
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length >= 2) {
          setComparedList(data.results.slice(0, 3));
        }
      });
  }, []);

  const handleRemove = (id: string) => {
    setComparedList(comparedList.filter((u) => u.id !== id));
  };

  const handleClear = () => {
    setComparedList([]);
  };

  if (comparedList.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-6 shadow-sm animate-fade-in my-8">
        <GitCompare className="w-16 h-16 text-emerald-800/40 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{t("title")}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t("empty")}</p>
        </div>
        <Link href="/universities">
          <Button className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-6 py-3 rounded-2xl font-bold text-xs">
            Browse Universities
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#01411C] text-white p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">{t("title")}</h1>
          <p className="text-xs text-emerald-100/90 mt-1">{t("subtitle")}</p>
        </div>
        <Button
          onClick={handleClear}
          variant="outline"
          className="border-red-400/40 bg-red-950/40 text-red-200 hover:bg-red-900 hover:text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          <span>{t("clearAll")}</span>
        </Button>
      </div>

      {/* Side-by-side comparison table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="p-4 w-44 font-bold text-xs text-slate-700">{t("colFeature")}</th>
              {comparedList.map((uni) => (
                <th key={uni.id} className="p-4 font-bold text-sm text-[#01411C] min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="line-clamp-1">{uni.name}</span>
                    <button
                      onClick={() => handleRemove(uni.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Location */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#01411C]" />
                {t("colLocation")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4 text-slate-800 font-medium">
                  {uni.city}, {uni.province}
                </td>
              ))}
            </tr>

            {/* Sector Type */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#01411C]" />
                {t("colSector")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${uni.type === "Public" ? "bg-emerald-100 text-emerald-900" : "bg-blue-100 text-blue-900"}`}>
                    {uni.type} Sector
                  </span>
                </td>
              ))}
            </tr>

            {/* Max Annual Fee */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#01411C]" />
                {t("colMaxFee")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4 font-extrabold text-[#01411C]">
                  {formatPKR(uni.fee_range_max)} / yr
                </td>
              ))}
            </tr>

            {/* QS Ranking */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#01411C]" />
                {t("colRanking")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4 font-bold text-amber-700">
                  {uni.ranking ? `#${uni.ranking} in QS Asia` : "HEC Recognized"}
                </td>
              ))}
            </tr>

            {/* Available Financial Aid */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#01411C]" />
                {t("colScholarships")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4">
                  <ScholarshipBadge hasHec={uni.has_hec_scholarship} hasUsaid={uni.has_usaid_scholarship} />
                </td>
              ))}
            </tr>

            {/* Programs Offered */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#01411C]" />
                {t("colPrograms")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {uni.programs.map((p, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Financial Aid Contact */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50/40 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#01411C]" />
                {t("colFinancialAid")}
              </td>
              {comparedList.map((uni) => (
                <td key={uni.id} className="p-4 text-slate-600 font-mono text-[11px]">
                  {uni.financial_aid_office || "Email: financialaid@university.edu.pk"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
