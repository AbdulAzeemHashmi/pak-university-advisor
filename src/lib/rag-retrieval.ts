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

export type QueryIntentType = "GREETING" | "SCHOLARSHIP" | "COMPARISON" | "SEARCH" | "OUT_OF_DOMAIN";

export interface QueryIntent {
  type: QueryIntentType;
  detectedCity?: string;
  detectedDegree?: string;
  detectedUniversities?: string[];
  isLowFee?: boolean;
}

export function detectQueryIntent(text: string): QueryIntent {
  const q = (text || "").toLowerCase().trim();

  // Greetings and conversational queries
  const greetingWords = [
    "hey", "hello", "hi", "salam", "assalam", "a.s", "aoa", "good morning", "good evening", "good afternoon",
    "kia haal", "kya haal", "kaise ho", "how are you", "who are you", "what can you do", "help", "guide me",
    "what is this", "start", "menu", "help me", "intro", "introduction"
  ];
  const isExactOrShortGreeting = greetingWords.some(w => q === w || q.startsWith(w + " ") || q.endsWith(" " + w));
  if (isExactOrShortGreeting && q.split(/\s+/).length <= 4) {
    return { type: "GREETING" };
  }

  // Detect Comparison
  const isComparison = q.includes("vs") || q.includes("versus") || q.includes("compare") || q.includes("comparison") || q.includes("بمقابلہ") || q.includes("فرق") || q.includes("better");

  // Detect Scholarship intent
  const isScholarship = q.includes("scholarship") || q.includes("financial aid") || q.includes("hec") || q.includes("usaid") || q.includes("fee waiver") || q.includes("free education") || q.includes("اسکالرشپ") || q.includes("وظیفہ") || q.includes("مفت");

  // Detect major cities
  const majorCities = [
    "lahore", "karachi", "islamabad", "rawalpindi", "peshawar", "quetta", "faisalabad",
    "multan", "hyderabad", "gujranwala", "sialkot", "bahawalpur", "sukkur", "abbottabad",
    "swat", "gilgit", "muzaffarabad", "mirpur", "taxila", "wah cantt"
  ];
  const detectedCity = majorCities.find(c => q.includes(c));

  // Detect major disciplines
  const disciplines = [
    "computer science", "cs", "software engineering", "se", "artificial intelligence", "ai",
    "data science", "ds", "cyber security", "electrical engineering", "mechanical engineering",
    "civil engineering", "mbbs", "bds", "pharm-d", "nursing", "business administration", "bba",
    "accounting", "finance", "economics", "law", "llb", "psychology", "fine arts", "architecture"
  ];
  const detectedDegree = disciplines.find(d => {
    if (d.length <= 2) {
      return new RegExp(`\\b${d}\\b`, "i").test(q);
    }
    return q.includes(d);
  });

  // Detect specific university acronyms
  const detectedUnis: string[] = [];
  Object.keys(ALIAS_MAP).forEach(aliasKey => {
    if (new RegExp(`\\b${aliasKey}\\b`, "i").test(q)) {
      detectedUnis.push(aliasKey);
    }
  });

  const isLowFee = q.includes("cheap") || q.includes("low fee") || q.includes("affordable") || q.includes("کم فیس") || q.includes("low cost") || q.includes("under");

  if (isComparison) {
    return { type: "COMPARISON", detectedCity, detectedDegree, detectedUniversities: detectedUnis, isLowFee };
  }

  if (isScholarship) {
    return { type: "SCHOLARSHIP", detectedCity, detectedDegree, detectedUniversities: detectedUnis, isLowFee };
  }

  return { type: "SEARCH", detectedCity, detectedDegree, detectedUniversities: detectedUnis, isLowFee };
}

export interface RAGRetrievalResult {
  results: University[];
  contextSummary: string;
  citedIds: string[];
  intent: QueryIntent;
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
  const intent = detectQueryIntent(query);

  // If the query is a simple greeting, do not force random universities into context
  if (intent.type === "GREETING") {
    const featuredInstitutions = allUniversities.filter(u =>
      ["uni_1", "uni_2", "uni_3", "uni_6", "uni_12"].includes(u.id) ||
      (u.ranking && u.ranking <= 5)
    ).slice(0, 4);

    return {
      results: featuredInstitutions,
      contextSummary: "Student has initiated a greeting. Provide a warm, encouraging welcome in English and Urdu, explain what guidance you can provide (fees, admissions, scholarships, comparisons), and suggest 3 sample questions.",
      citedIds: [],
      intent
    };
  }

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
  const isScholarshipQuery = intent.type === "SCHOLARSHIP";
  const isLowFeeQuery = intent.isLowFee;

  // Check alias matches
  const matchedAliasKeywords: string[] = [];
  Object.entries(ALIAS_MAP).forEach(([aliasKey, keywords]) => {
    if (new RegExp(`\\b${aliasKey}\\b`, "i").test(queryLower)) {
      matchedAliasKeywords.push(...keywords);
    }
  });

  // Score all documents
  const scoredDocs = typedEmbeddings.vectorizedIndex.map(doc => {
    const uni = uniMap.get(doc.id);
    if (!uni) return { id: doc.id, score: 0 };

    const effectiveCity = filters?.city && filters.city !== "all" && filters.city !== "All"
      ? filters.city
      : intent.detectedCity;

    if (effectiveCity) {
      if (uni.city.toLowerCase() !== effectiveCity.toLowerCase()) {
        if (intent.type === "COMPARISON") {
          // Keep comparison candidates across cities
        } else {
          return { id: doc.id, score: -1 };
        }
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
      boost += 2.0;
    }

    // Alias Keyword Boost
    if (matchedAliasKeywords.length > 0) {
      const nameLower = uni.name.toLowerCase();
      if (matchedAliasKeywords.some(kw => nameLower.includes(kw))) {
        boost += 2.5;
      }
    }

    // City Match Boost
    if (intent.detectedCity && uni.city.toLowerCase() === intent.detectedCity.toLowerCase()) {
      boost += 0.8;
    }

    // Discipline Match Boost
    if (intent.detectedDegree && uni.programs && uni.programs.some(p => p.toLowerCase().includes(intent.detectedDegree!.toLowerCase()))) {
      boost += 0.5;
    }

    // Sector Intent Boost
    if (isPublicQuery && uni.type === "Public") boost += 0.4;
    if (isPrivateQuery && uni.type === "Private") boost += 0.4;

    // Scholarship Intent Boost
    if (isScholarshipQuery && (uni.has_hec_scholarship || uni.has_usaid_scholarship)) {
      boost += 0.8;
    }

    // Low Fee Intent Boost
    if (isLowFeeQuery && uni.fee_range_max <= 150000) {
      boost += 0.6;
    }

    // Max Fee Filter
    if (filters?.maxFee && filters.maxFee > 0) {
      if (uni.fee_range_max > filters.maxFee) {
        boost *= 0.2;
      }
    }

    const finalScore = (cosSim > 0 ? cosSim : 0.05) * boost;
    return { id: doc.id, score: finalScore };
  });

  // Filter out invalid scores and sort descending
  const validScored = scoredDocs
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);

  // Pick top K universities
  const topKDocs = validScored.slice(0, topK);
  const topUnis: University[] = [];

  topKDocs.forEach(item => {
    const u = uniMap.get(item.id);
    if (u) topUnis.push(u);
  });

  // Smart Context Fallback:
  // If vector search returned fewer than topK, intelligently match based on intent instead of arbitrary alphabetical dumping
  if (topUnis.length < topK) {
    const existingIds = new Set(topUnis.map(u => u.id));

    // 1. If user asked for scholarships, backfill with actual scholarship institutions
    if (isScholarshipQuery) {
      for (const u of allUniversities) {
        if (topUnis.length >= topK) break;
        if ((u.has_hec_scholarship || u.has_usaid_scholarship) && !existingIds.has(u.id)) {
          topUnis.push(u);
          existingIds.add(u.id);
        }
      }
    }

    // 2. If user asked for a city, backfill with universities in that city
    if (intent.detectedCity) {
      for (const u of allUniversities) {
        if (topUnis.length >= topK) break;
        if (u.city.toLowerCase() === intent.detectedCity.toLowerCase() && !existingIds.has(u.id)) {
          topUnis.push(u);
          existingIds.add(u.id);
        }
      }
    }

    // 3. If user asked for low fee, backfill with low fee public universities
    if (isLowFeeQuery) {
      for (const u of allUniversities) {
        if (topUnis.length >= topK) break;
        if (u.type === "Public" && u.fee_range_max <= 100000 && !existingIds.has(u.id)) {
          topUnis.push(u);
          existingIds.add(u.id);
        }
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
    citedIds,
    intent
  };
}
