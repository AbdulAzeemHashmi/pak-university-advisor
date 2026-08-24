"use client";

import { useTranslations } from "next-intl";
import { University } from "@/types";
import { formatPKR } from "@/lib/utils";
import ScholarshipBadge from "./ScholarshipBadge";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  MapPin, 
  Calendar, 
  Trophy, 
  ExternalLink, 
  Phone, 
  Mail, 
  Building2, 
  GraduationCap, 
  Award, 
  CheckCircle,
  Wifi,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UniversityDetailModalProps {
  university: University | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UniversityDetailModal({
  university,
  isOpen,
  onClose
}: UniversityDetailModalProps) {
  const t = useTranslations("card");
  const fallbackT = useTranslations("fallback");

  if (!isOpen || !university) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-emerald-800/20 overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#01411C] via-[#0A5C2B] to-[#1A8F3C] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-100 hover:text-white rounded-full hover:bg-emerald-800/50 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={university.type === "Public" ? "default" : "secondary"}>
                {university.type === "Public" ? t("publicBadge") : t("privateBadge")}
              </Badge>
              <Badge variant="gold" className="bg-amber-400/20 text-amber-300 border-amber-400/40">
                {university.category || "General"}
              </Badge>
              {university.distance_education && (
                <Badge variant="secondary" className="bg-purple-900/40 text-purple-200 border-purple-400/40 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-purple-300" />
                  Distance Learning
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-black leading-tight text-white">{university.name}</h2>
            {university.name_urdu && university.name_urdu !== university.name && (
              <p className="text-sm font-semibold text-amber-300 font-arabic">{university.name_urdu}</p>
            )}

            <p className="text-xs text-emerald-100/90 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{university.city}, {university.province} • Chartered by {university.chartered_by || "Government of Pakistan"}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Fee & Ranking Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">{t("annualFee")}</span>
              <span className="text-base font-extrabold text-[#01411C]">{formatPKR(university.fee_range_max)} <span className="text-[10px] font-normal text-slate-500">/ yr</span></span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">QS Ranking</span>
              <span className="text-sm font-bold text-amber-700">{university.ranking ? `#${university.ranking} in QS Asia` : "HEC Recognized"}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Established</span>
              <span className="text-sm font-bold text-slate-800">{university.established_year ? `Year ${university.established_year}` : "Chartered"}</span>
            </div>
          </div>

          {/* Official Contact Info & Website */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4 text-[#01411C]" />
              <span>Official Contacts & Campuses</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Phone & Email</span>
                <p className="flex items-center gap-1.5 text-slate-800 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#01411C]" />
                  <span>{university.phone || "+92-51-111-000-111"}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-800 font-mono">
                  <Mail className="w-3.5 h-3.5 text-[#01411C]" />
                  <span>{university.email || "info@university.edu.pk"}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Campuses</span>
                <p className="text-slate-800 font-medium leading-relaxed">{university.campuses || "Main Campus"}</p>
              </div>
            </div>

            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#01411C] hover:text-[#1A8F3C] pt-1"
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Visit Official University Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Scholarship & Financial Aid Info */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Award className="w-4 h-4 text-[#01411C]" />
              <span>Scholarships & Financial Aid Availability</span>
            </h3>

            <ScholarshipBadge hasHec={university.has_hec_scholarship} hasUsaid={university.has_usaid_scholarship} />

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 block">Aid Office Contact & Details:</span>
              <p className="text-emerald-900 font-medium leading-relaxed">{university.scholarship_details || "Provides full HEC Need-Based & USAID Merit and Needs-Based Scholarships for eligible low-income students."}</p>
              <p className="text-slate-700 font-mono text-[11px] pt-1 border-t border-emerald-200/60">{university.financial_aid_office || "Financial Aid Office, " + university.name}</p>
            </div>
          </div>

          {/* Programs Offered */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <GraduationCap className="w-4 h-4 text-[#01411C]" />
              <span>Available Degree Programs ({university.programs.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {university.programs.map((p, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200/60">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Google Maps Embed / Location Link */}
          {university.google_map_url && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-[#01411C]" />
                <span>Geographic Location & Map Navigation</span>
              </h3>

              <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 h-48 flex items-center justify-center relative">
                {university.google_map_url.includes("embed") ? (
                  <iframe
                    src={university.google_map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title={`Google Map - ${university.name}`}
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <MapPin className="w-8 h-8 text-[#01411C] mx-auto animate-bounce" />
                    <p className="text-xs text-slate-600 font-medium">Interactive Google Maps navigation available for {university.name}</p>
                    <a
                      href={university.google_map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#01411C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#1A8F3C]"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#01411C] hover:bg-[#1A8F3C] text-white px-6 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            Close Details
          </Button>
        </div>

      </div>
    </div>
  );
}
