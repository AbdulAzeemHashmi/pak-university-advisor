import { University, SearchFilters, PaginatedResult } from "@/types";
import { getLocalMasterUniversities } from "@/lib/xata";

interface AliasGroup {
  aliases: string[];
  targetKeywords: string[];
}

const ALIAS_GROUPS: AliasGroup[] = [
  {
    aliases: [
      "fast",
      "fast-nuces",
      "fast nuces",
      "nuces",
      "national university of computer and emerging sciences",
      "national university of computer & emerging sciences"
    ],
    targetKeywords: ["national university of computer", "fast", "nuces"]
  },
  {
    aliases: ["nust", "national university of sciences and technology", "national university of sciences & technology"],
    targetKeywords: ["national university of sciences", "nust"]
  },
  {
    aliases: ["lums", "lahore university of management sciences"],
    targetKeywords: ["lahore university of management sciences", "lums"]
  },
  {
    aliases: ["uet", "university of engineering and technology", "university of engineering & technology"],
    targetKeywords: ["university of engineering", "uet"]
  },
  {
    aliases: ["comsats", "cui"],
    targetKeywords: ["comsats"]
  },
  {
    aliases: ["giki", "ghulam ishaq khan institute"],
    targetKeywords: ["ghulam ishaq khan", "giki"]
  },
  {
    aliases: ["pieas", "pakistan institute of engineering and applied sciences"],
    targetKeywords: ["pakistan institute of engineering", "pieas"]
  },
  {
    aliases: ["iba", "institute of business administration"],
    targetKeywords: ["institute of business administration", "iba"]
  },
  {
    aliases: ["gcu", "government college university"],
    targetKeywords: ["government college university", "gcu"]
  },
  {
    aliases: ["itu", "information technology university"],
    targetKeywords: ["information technology university", "itu"]
  },
  {
    aliases: ["lcwu", "lahore college for women university"],
    targetKeywords: ["lahore college for women", "lcwu"]
  },
  {
    aliases: ["pu", "punjab university", "university of the punjab"],
    targetKeywords: ["university of the punjab", "punjab university"]
  },
  {
    aliases: ["nums", "national university of medical sciences"],
    targetKeywords: ["national university of medical sciences", "nums"]
  },
  {
    aliases: ["numl", "national university of modern languages"],
    targetKeywords: ["national university of modern languages", "numl"]
  },
  {
    aliases: ["nutech", "national university of technology"],
    targetKeywords: ["national university of technology", "nutech"]
  }
];

export async function fetchUniversities(filters: SearchFilters): Promise<PaginatedResult<University>> {
  const allUniversities = getLocalMasterUniversities();
  
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;

  let filtered = allUniversities;

  // Search Query filter with intelligent alias & synonym resolution
  if (filters.searchQuery) {
    const rawQ = filters.searchQuery.toLowerCase().trim();
    const normalizedQ = rawQ.replace(/[\-&]/g, " ").replace(/\s+/g, " ").trim();

    // Check if query matches any known university alias group
    const matchedGroups = ALIAS_GROUPS.filter(group => 
      group.aliases.some(alias => {
        const normAlias = alias.toLowerCase().replace(/[\-&]/g, " ").replace(/\s+/g, " ").trim();
        return normAlias === normalizedQ || alias.toLowerCase() === rawQ;
      })
    );

    const groupKeywords = matchedGroups.flatMap(g => g.targetKeywords);

    filtered = filtered.filter(u => {
      const uNameLower = u.name.toLowerCase();
      const matchDirect = 
        uNameLower.includes(rawQ) || 
        uNameLower.includes(normalizedQ) ||
        (u.name_urdu && u.name_urdu.includes(rawQ)) ||
        u.city.toLowerCase().includes(rawQ) ||
        u.province.toLowerCase().includes(rawQ) ||
        (u.category && u.category.toLowerCase().includes(rawQ));

      const matchAlias = groupKeywords.length > 0 && groupKeywords.some(kw => uNameLower.includes(kw));

      return matchDirect || matchAlias;
    });
  }

  // City filter
  if (filters.city && filters.city !== "all") {
    const c = filters.city.toLowerCase().trim();
    filtered = filtered.filter(u => u.city.toLowerCase() === c);
  }

  // Province filter
  if (filters.province && filters.province !== "all") {
    const p = filters.province.toLowerCase().trim();
    filtered = filtered.filter(u => u.province.toLowerCase() === p);
  }

  // Category filter
  if (filters.category && filters.category !== "all") {
    const cat = filters.category.toLowerCase().trim();
    filtered = filtered.filter(u => u.category && u.category.toLowerCase().includes(cat));
  }

  // Distance Education filter
  if (filters.distanceEducation) {
    filtered = filtered.filter(u => u.distance_education === true);
  }

  // University Sector Type filter
  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter(u => u.type.toLowerCase() === filters.type?.toLowerCase());
  }

  // Degree Program filter
  if (filters.degree && filters.degree !== "all") {
    const d = filters.degree.toLowerCase().trim();
    filtered = filtered.filter(u => 
      u.programs && u.programs.some(p => p.toLowerCase().includes(d))
    );
  }

  // Max Fee filter
  let scholarshipOptions: University[] | undefined = undefined;

  if (filters.maxFee !== undefined && filters.maxFee > 0) {
    const max = filters.maxFee;
    const feeFiltered = filtered.filter(u => u.fee_range_max <= max);

    // Smart Fallback Logic:
    // If no university fits the student's max_fee, automatically display universities in that region that offer need-based scholarships
    if (feeFiltered.length === 0) {
      scholarshipOptions = filtered.filter(u => u.has_hec_scholarship || u.has_usaid_scholarship);
      filtered = [];
    } else {
      filtered = feeFiltered;
    }
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedResults = filtered.slice(startIndex, startIndex + limit);

  return {
    results: paginatedResults,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    scholarshipOptions
  };
}

export async function fetchScholarshipUniversities(city?: string, degree?: string): Promise<University[]> {
  const all = getLocalMasterUniversities();
  return all.filter(u => {
    const matchScholarship = u.has_hec_scholarship || u.has_usaid_scholarship;
    const matchCity = !city || city === "all" || u.city.toLowerCase() === city.toLowerCase();
    const matchDegree = !degree || degree === "all" || (u.programs && u.programs.some(p => p.toLowerCase().includes(degree.toLowerCase())));
    return matchScholarship && matchCity && matchDegree;
  });
}

export async function getAllUniqueCities(): Promise<string[]> {
  const all = getLocalMasterUniversities();
  const cities = Array.from(new Set(all.map(u => u.city).filter(Boolean)));
  return cities.sort();
}

export async function getAllUniquePrograms(): Promise<string[]> {
  const all = getLocalMasterUniversities();
  const programSet = new Set<string>();
  all.forEach(u => u.programs && u.programs.forEach(p => programSet.add(p)));
  return Array.from(programSet).sort();
}

export async function getAllUniqueCategories(): Promise<string[]> {
  const all = getLocalMasterUniversities();
  const categories = Array.from(new Set(all.map(u => u.category).filter(Boolean)));
  return categories.sort();
}
