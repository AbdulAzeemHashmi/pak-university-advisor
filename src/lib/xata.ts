import { buildClient } from "@xata.io/client";
import type { University } from "@/types";
import masterJsonData from "@/../data/processed/master_universities.json";

/**
 * Verified against each institution's published financial-aid information.
 * Keep this deliberately small and source-backed; a financial-aid office alone
 * is not enough to mark a university as a need-based scholarship provider.
 */
const HEC_NEED_BASED_PROVIDER_NAMES = [
  "University of Azad Jammu & Kashmir", "Mirpur University of Science & Technology", "University of Poonch", "Women University of Azad Jammu & Kashmir", "University of Management Sciences and Information Technology",
  "University of Balochistan", "Sardar Bahadur Khan Women University", "University of Turbat", "Balochistan University of Engineering and Technology", "Balochistan University of Information Technology, Engineering and Management Sciences", "Lasbela University of Agriculture",
  "Quaid-i-Azam University", "International Islamic University", "National University of Modern Languages", "Federal Urdu University", "Air University", "National Defence University", "Bahria University", "COMSATS", "Institute of Space Technology", "Pakistan Institute of Development Economics",
  "Karakoram International University", "University of Peshawar", "Gomal University", "Kohat University of Science and Technology", "University of Malakand", "Hazara University", "University of Science and Technology", "Shaheed Benazir Bhutto Women University", "Islamia College University", "Abdul Wali Khan University", "Shaheed Benazir Bhutto University", "University of Swat", "University of Haripur", "Bacha Khan University", "University of Swabi", "University of Agriculture, Peshawar", "University of Engineering and Technology, Peshawar", "Khyber Medical University", "Institute of Management Sciences", "Khushal Khan Khattak University",
  "University of the Punjab", "Bahauddin Zakariya University", "Islamia University Bahawalpur", "Fatima Jinnah Women University", "Government College University, Lahore", "Lahore College for Women University", "Government College University, Faisalabad", "University of Sargodha", "University of Education", "University of Gujrat", "Government College Women University, Faisalabad", "Women University Multan", "Ghazi University", "Pakistan Institute of Fashion and Design", "University of Agriculture, Faisalabad", "Pir Mehr Ali Shah Arid Agriculture University", "University of Veterinary and Animal Sciences", "Muhammad Nawaz Sharif University of Agriculture", "University of Engineering and Technology, Lahore", "University of Engineering and Technology, Taxila", "National Textile University", "University of Health Sciences", "King Edward Medical University", "Kinnaird College for Women",
  "University of Karachi", "University of Sindh", "Shah Abdul Latif University", "Sindh Madressatul Islam University", "Shaheed Benazir Bhutto University", "Benazir Bhutto Shaheed University", "Sindh Agriculture University", "NED University of Engineering and Technology", "Mehran University of Engineering and Technology", "Quaid-e-Awam University of Engineering", "Liaquat University of Medical and Health Sciences", "Dow University of Health Sciences", "People's University of Medical and Health Sciences", "Shaheed Mohtarma Benazir Bhutto Medical University", "Jinnah Sindh Medical University", "Institute of Business Administration"
];

const USAID_MNBSP_PROVIDER_NAMES = [
  "Lahore University of Management Sciences", "Balochistan University of Information Technology, Engineering and Management Sciences", "Institute of Business Administration", "Shaheed Zulfikar Ali Bhutto Institute of Science and Technology", "Quaid-i-Azam University", "Institute of Management Sciences", "University of Karachi", "Shaheed Benazir Bhutto Women University", "Fatima Jinnah Women University", "University of the Punjab", "Lahore College for Women University", "Karakoram International University", "Islamia University Bahawalpur", "Bahauddin Zakariya University", "Dow University of Health Sciences", "National University of Sciences and Technology", "University of Health Sciences", "Pakistan Institute of Engineering and Applied Sciences", "University of Engineering and Technology, Lahore", "Khyber Medical University", "University of Engineering and Technology, Peshawar", "COMSATS", "Mehran University of Engineering and Technology", "University of Agriculture, Faisalabad", "University of Agriculture, Peshawar", "Sindh Agriculture University", "Pir Mehr Ali Shah Arid Agriculture University"
];

const normalizeUniversityName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const nameMatchesProvider = (universityName: string, providerName: string) => {
  const university = normalizeUniversityName(universityName);
  const provider = normalizeUniversityName(providerName);
  return university.includes(provider) || provider.includes(university);
};

const HEC_NEED_BASED_SOURCE = "https://www.hec.gov.pk/english/scholarshipsgrants/Pages/National%20Scholarships/HEC%20Need%20Based%20Scholarships/EligibilityCriteria.aspx";
const USAID_MNBSP_SOURCE = "https://www.hec.gov.pk/english/scholarshipsgrants/USAID-NeedsBased/Pages/List-of-universities.aspx";

// Types for Xata auto-generated client wrapper
const tables = [
  {
    name: "universities",
    columns: []
  }
] as const;

export class XataClient extends buildClient() {
  constructor(options = {}) {
    super(
      {
        databaseURL: process.env.XATA_DATABASE_URL || "",
        apiKey: process.env.XATA_API_KEY || "",
        branch: process.env.XATA_BRANCH || "main",
        ...options,
      },
      tables
    );
  }
}

let instance: XataClient | undefined = undefined;

export const getXataClient = () => {
  if (instance) return instance;
  instance = new XataClient();
  return instance;
};

/** Production user data must live in a durable database, never in a serverless filesystem. */
export const hasXataPersistence = () => Boolean(
  process.env.XATA_DATABASE_URL && process.env.XATA_API_KEY
);

// Fallback helper when Xata credentials are not active in environment
export const getLocalMasterUniversities = (): University[] => {
  return (masterJsonData as unknown as University[]).map(university => {
    const hasHec = university.has_hec_scholarship || HEC_NEED_BASED_PROVIDER_NAMES.some(name => nameMatchesProvider(university.name, name));
    const hasUsaid = university.has_usaid_scholarship || USAID_MNBSP_PROVIDER_NAMES.some(name => nameMatchesProvider(university.name, name));
    if (!hasHec && !hasUsaid) return university;
    const programmes = [
      ...(university.scholarship_programs || []),
      ...(hasHec ? ["HEC Need-Based Scholarship"] : []),
      ...(hasUsaid ? ["USAID Merit and Needs-Based Scholarship (MNBSP)"] : [])
    ];
    return {
      ...university,
      has_hec_scholarship: hasHec,
      has_usaid_scholarship: hasUsaid,
      scholarship_programs: [...new Set(programmes)],
      scholarship_details: university.scholarship_details || `Participating-institution record from HEC. Confirm eligibility, coverage, approved disciplines and deadlines with the university Financial Aid Office. HEC sources: ${hasHec ? HEC_NEED_BASED_SOURCE : USAID_MNBSP_SOURCE}`
    };
  });
};
