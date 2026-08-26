import { University, SearchFilters } from "@/types";
import { getLocalMasterUniversities } from "@/lib/xata";

// Load vector embeddings data dynamically or via fallback
import embeddingsData from "../../data/processed/university_embeddings.json";

interface VectorDoc {
  id: string;
  vector: Record<string, number>;
  norm: number;
  chunkSnippet: string;
}

interface EmbeddingsFile {
  idf: Record<string, number>;
  vectorizedIndex: VectorDoc[];
}

const typedEmbeddings = embeddingsData as unknown as EmbeddingsFile;

function tokenizeQuery(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 1);
  const grams: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    grams.push(words[i]);
    if (i < words.length - 1) {
      grams.push(`${words[i]}_${words[i + 1]}`);
    }
  }
  return grams;
}

const ALIAS_MAP: Record<string, string[]> = {
  fast: ["fast", "nuces", "national university of computer"],
  nust: ["nust", "national university of sciences"],
  lums: ["lums", "lahore university of management"],
  uet: ["uet", "university of engineering and technology"],
  comsats: ["comsats", "cui"],
  giki: ["giki", "ghulam ishaq khan"],
  pieas: ["pieas", "pakistan institute of engineering"],
  iba: ["iba", "institute of business administration"],
  gcu: ["gcu", "government college university"],
  pu: ["punjab university", "university of the punjab"],
  itu: ["information technology university"],
  nums: ["national university of medical sciences"],
  numl: ["national university of modern languages"]
};

export interface RAGRetrievalResult {
  results: University[];
  contextSummary: string;
  citedIds: string[];
}

export async function searchUniversitiesRAG(
  query: string,
  filters?: SearchFilters,
  topK: number = 6
): Promise<RAGRetrievalResult> {
  const allUniversities = getLocalMasterUniversities();
  const uniMap = new Map<string, University>();
  allUniversities.forEach(u => uniMap.set(u.id, u));

  const queryLower = (query || "").toLowerCase();
  const tokens = tokenizeQuery(query);

  // Compute Query Vector using Corpus IDF
  const queryTf: Record<string, number> = {};
  tokens.forEach(token => {
    queryTf[token] = (queryTf[token] || 0) + 1;
  });

  const queryVector: Record<string, number> = {};
  let queryMagSq = 0;

  Object.keys(queryTf).forEach(term => {
    const idfVal = typedEmbeddings.idf[term] || Math.log(1 + typedEmbeddings.vectorizedIndex.length);
    const weight = queryTf[term] * idfVal;
    queryVector[term] = weight;
    queryMagSq += weight * weight;
  });

  const queryNorm = Math.sqrt(queryMagSq);

  // Detect explicit intent signals from query
  const isPublicQuery = queryLower.includes("public") || queryLower.includes("government") || queryLower.includes("سرکاری");
  const isPrivateQuery = queryLower.includes("private") || queryLower.includes("پرائیویٹ");
  const isScholarshipQuery = queryLower.includes("scholarship") || queryLower.includes("financial aid") || queryLower.includes("hec") || queryLower.includes("usaid") || queryLower.includes("اسکالرشپ") || queryLower.includes("مفت");
  const isLowFeeQuery = queryLower.includes("cheap") || queryLower.includes("low fee") || queryLower.includes("affordable") || queryLower.includes("کم فیس");

  // Check alias matches
  const matchedAliasKeywords: string[] = [];
  Object.entries(ALIAS_MAP).forEach(([aliasKey, keywords]) => {
    if (queryLower.includes(aliasKey)) {
      matchedAliasKeywords.push(...keywords);
    }
  });

  // Score all documents
  const scoredDocs = typedEmbeddings.vectorizedIndex.map(doc => {
    const uni = uniMap.get(doc.id);
    if (!uni) return { id: doc.id, score: 0 };

    // Metadata Filter Checks (Hard or Soft penalties)
    if (filters?.city && filters.city !== "all" && filters.city !== "All") {
      if (uni.city.toLowerCase() !== filters.city.toLowerCase()) {
        return { id: doc.id, score: -1 };
      }
    }

    if (filters?.province && filters.province !== "all" && filters.province !== "All") {
      if (uni.province.toLowerCase() !== filters.province.toLowerCase()) {
        return { id: doc.id, score: -1 };
      }
    }

    if (filters?.type && filters.type !== "all") {
      if (uni.type.toLowerCase() !== filters.type.toLowerCase()) {
        return { id: doc.id, score: -1 };
      }
    }

    // Cosine Vector Similarity calculation
    let dotProduct = 0;
    Object.keys(queryVector).forEach(term => {
      if (doc.vector[term]) {
        dotProduct += queryVector[term] * doc.vector[term];
      }
    });

    let cosSim = (queryNorm > 0 && doc.norm > 0) ? (dotProduct / (queryNorm * doc.norm)) : 0;

    // Feature Boosting
    let boost = 1.0;

    // Direct Name Match
    if (uni.name.toLowerCase().includes(queryLower) || (uni.name_urdu && uni.name_urdu.includes(queryLower))) {
      boost += 1.5;
    }

    // Alias Keyword Boost
    if (matchedAliasKeywords.length > 0) {
      const nameLower = uni.name.toLowerCase();
      if (matchedAliasKeywords.some(kw => nameLower.includes(kw))) {
        boost += 1.2;
      }
    }

    // Sector Intent Boost
    if (isPublicQuery && uni.type === "Public") boost += 0.3;
    if (isPrivateQuery && uni.type === "Private") boost += 0.3;

    // Scholarship Intent Boost
    if (isScholarshipQuery && (uni.has_hec_scholarship || uni.has_usaid_scholarship)) {
      boost += 0.4;
    }

    // Low Fee Intent Boost
    if (isLowFeeQuery && uni.fee_range_max <= 200000) {
      boost += 0.3;
    }

    // Max Fee Filter
    if (filters?.maxFee && filters.maxFee > 0) {
      if (uni.fee_range_max > filters.maxFee) {
        boost *= 0.2; // Penalty if above user max budget
      }
    }

    const finalScore = cosSim * boost;
    return { id: doc.id, score: finalScore };
  });

  // Filter out invalid scores and sort descending
  const validScored = scoredDocs
    .filter(d => d.score >= 0)
    .sort((a, b) => b.score - a.score);

  // Pick top K universities
  const topKDocs = validScored.slice(0, topK);
  const topUnis: University[] = [];

  topKDocs.forEach(item => {
    const u = uniMap.get(item.id);
    if (u) topUnis.push(u);
  });

  // Fallback: If vector retrieval returned fewer than topK, fill with general matching universities
  if (topUnis.length < topK) {
    const existingIds = new Set(topUnis.map(u => u.id));
    for (const u of allUniversities) {
      if (topUnis.length >= topK) break;
      if (!existingIds.has(u.id)) {
        topUnis.push(u);
        existingIds.add(u.id);
      }
    }
  }

  // Build Context Summary for Prompt Grounding
  const contextLines = topUnis.map((u, idx) => {
    const scholarshipText = [
      u.has_hec_scholarship ? "HEC Need-Based (100% Waiver)" : "",
      u.has_usaid_scholarship ? "USAID MNBSP Scholarship" : "",
      ...(u.scholarship_programs || [])
    ].filter(Boolean).join(", ");

    return `[University #${idx + 1}]
- ID: ${u.id}
- Name: ${u.name} ${u.name_urdu ? `(${u.name_urdu})` : ""}
- Location: ${u.city}, ${u.province}
- Sector: ${u.type} Sector | Category: ${u.category} | Chartered by: ${u.chartered_by || "Government"}
- Annual Fee Max: PKR ${u.fee_range_max.toLocaleString()} / year
- Scholarships: ${scholarshipText || "Institutional Aid via Financial Aid Office"}
- Financial Aid Office / Details: ${u.financial_aid_office || "Contact Admissions Office"} - ${u.scholarship_details || ""}
- Programs Offered: ${u.programs.join(", ")}
- Website: ${u.website || "N/A"}`;
  });

  const contextSummary = contextLines.join("\n\n");
  const citedIds = topUnis.map(u => u.id);

  return {
    results: topUnis,
    contextSummary,
    citedIds
  };
}
