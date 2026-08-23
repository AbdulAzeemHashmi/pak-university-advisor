"use client";

import { useState, useEffect } from "react";
import { SearchFilters, University, PaginatedResult } from "@/types";
import FilterBar from "@/components/FilterBar";
import UniversityList from "@/components/UniversityList";
import AIAdvisorModal from "@/components/AIAdvisorModal";
import { Sparkles, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UniversitiesSearchClientProps {
  cities: string[];
  programs: string[];
  initialFilters: SearchFilters;
}

export default function UniversitiesSearchClient({
  cities,
  programs,
  initialFilters
}: UniversitiesSearchClientProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<PaginatedResult<University> | null>(null);
  const [loading, setLoading] = useState(true);

  // Client state for shortlists & compare list
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [comparedUnis, setComparedUnis] = useState<University[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (filters.searchQuery) query.set("searchQuery", filters.searchQuery);
        if (filters.city) query.set("city", filters.city);
        if (filters.province) query.set("province", filters.province);
        if (filters.degree) query.set("degree", filters.degree);
        if (filters.type) query.set("type", filters.type);
        if (filters.maxFee) query.set("maxFee", filters.maxFee.toString());
        if (filters.page) query.set("page", filters.page.toString());

        const res = await fetch(`/api/universities?${query.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch universities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [filters]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleToggleShortlist = (id: string) => {
    if (shortlistedIds.includes(id)) {
      setShortlistedIds(shortlistedIds.filter((item) => item !== id));
      fetch("/api/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: id })
      });
    } else {
      setShortlistedIds([...shortlistedIds, id]);
      fetch("/api/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: id })
      });
    }
  };

  const handleToggleCompare = (university: University) => {
    if (comparedUnis.some((u) => u.id === university.id)) {
      setComparedUnis(comparedUnis.filter((u) => u.id !== university.id));
    } else {
      if (comparedUnis.length >= 4) {
        alert("You can compare up to 4 universities at a time.");
        return;
      }
      setComparedUnis([...comparedUnis, university]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#01411C] text-white p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Search & Filter Universities</h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Filter by tuition budget, city, degree program, and discover HEC & USAID financial aid options.
          </p>
        </div>
        <Button
          onClick={() => setIsAiModalOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-[#01411C] font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI Advisor</span>
        </Button>
      </div>

      {/* Filter Component */}
      <FilterBar
        cities={cities}
        programs={programs}
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Results Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#01411C]" />
        </div>
      ) : data ? (
        <UniversityList
          data={data}
          shortlistedIds={shortlistedIds}
          comparedIds={comparedUnis.map((u) => u.id)}
          onPageChange={(page) => handleFilterChange({ page })}
          onToggleShortlist={handleToggleShortlist}
          onToggleCompare={handleToggleCompare}
          maxFeeFilter={filters.maxFee}
        />
      ) : null}

      {/* Floating AI Modal */}
      <AIAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultCity={filters.city}
        defaultDegree={filters.degree}
        defaultBudget={filters.maxFee}
      />
    </div>
  );
}
