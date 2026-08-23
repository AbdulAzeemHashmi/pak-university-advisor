export interface University {
  id: string;
  name: string;
  name_urdu?: string;
  city: string;
  province: string;
  type: 'Public' | 'Private';
  established_year?: number | null;
  website?: string;
  image_url?: string;
  ranking?: number | null;
  fee_range_max: number;
  has_hec_scholarship: boolean;
  has_usaid_scholarship: boolean;
  scholarship_programs: string[];
  financial_aid_office?: string;
  scholarship_details?: string;
  programs: string[];
}

export interface SearchFilters {
  city?: string;
  province?: string;
  degree?: string;
  maxFee?: number;
  type?: 'Public' | 'Private' | 'all';
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
}

export interface ShortlistItem {
  id: string;
  userId: string;
  universityId: string;
  university?: University;
  addedAt: string;
}

export interface PaginatedResult<T> {
  results: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  scholarshipOptions?: T[];
}
