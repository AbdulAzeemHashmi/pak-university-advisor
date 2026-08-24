import { University, SearchFilters, PaginatedResult } from "@/types";
import { getLocalMasterUniversities } from "@/lib/xata";
import { getStoredShortlist, updateStoredShortlist } from "@/lib/local-store";

export async function fetchUniversities(filters: SearchFilters): Promise<PaginatedResult<University>> {
  const allUniversities = getLocalMasterUniversities();
  
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;

  let filtered = allUniversities;

  // Search Query filter
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.name_urdu && u.name_urdu.includes(q)) ||
      u.city.toLowerCase().includes(q) ||
      u.province.toLowerCase().includes(q) ||
      (u.category && u.category.toLowerCase().includes(q))
    );
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

export async function getShortlist(userId: string): Promise<University[]> {
  const all = getLocalMasterUniversities();
  const uniIds = await getStoredShortlist(userId);
  return all.filter(u => uniIds.includes(u.id));
}

export async function addToShortlist(userId: string, universityId: string): Promise<boolean> {
  await updateStoredShortlist(userId, universityId, true);
  return true;
}

export async function removeFromShortlist(userId: string, universityId: string): Promise<boolean> {
  await updateStoredShortlist(userId, universityId, false);
  return true;
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
