import { buildClient } from "@xata.io/client";
import type { University } from "@/types";
import masterJsonData from "@/../data/processed/master_universities.json";

/**
 * Verified against each institution's published financial-aid information.
 * Keep this deliberately small and source-backed; a financial-aid office alone
 * is not enough to mark a university as a need-based scholarship provider.
 */
const VERIFIED_NEED_BASED_AID: Record<string, Pick<University, "has_hec_scholarship" | "has_usaid_scholarship" | "scholarship_programs" | "scholarship_details">> = {
  uni_138: {
    has_hec_scholarship: true,
    has_usaid_scholarship: false,
    scholarship_programs: ["NUST Need-Based Financial Aid"],
    scholarship_details: "Need-based aid may cover partial or full academic expenditures. Verify eligibility, coverage and deadlines with the NUST Financial Aid Office: https://nust.edu.pk/admissions/scholarships/need-based-financial-aid/"
  },
  uni_77: {
    has_hec_scholarship: true,
    has_usaid_scholarship: false,
    scholarship_programs: ["IBA Need-Based Financial Assistance"],
    scholarship_details: "Need-based tuition assistance is assessed by IBA's Financial Assistance Committee. Verify eligibility, coverage and deadlines: https://osa.iba.edu.pk/faq.php"
  },
  uni_111: {
    has_hec_scholarship: true,
    has_usaid_scholarship: false,
    scholarship_programs: ["LUMS Need-Based Financial Aid"],
    scholarship_details: "LUMS offers financial aid for students demonstrating academic achievement and financial need. Verify current criteria and coverage: https://financial-aid.lums.edu.pk/"
  }
};

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
    const verifiedAid = VERIFIED_NEED_BASED_AID[university.id];
    return verifiedAid ? { ...university, ...verifiedAid } : university;
  });
};
