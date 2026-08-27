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

// Each alias entry maps an acronym to an ordered array of name substrings to search for,
// from most specific to least specific. The first entry is the canonical identifier.
const ALIAS_MAP: Record<string, string[]> = {
  fast: ["national university of computer", "nuces"],
  nuces: ["national university of computer", "nuces"],
  nust: ["national university of sciences & technology", "national university of sciences and technology"],
  lums: ["lahore university of management"],
  // UET aliases must be disambiguated by city context:
  uet: ["university of engineering & technology", "university of engineering and technology"],
  "uet lahore": ["university of engineering & technology (2)"],
  "uet taxila": ["university of engineering & technology, taxila"],
  "uet peshawar": ["university of engineering & technology"],
  comsats: ["comsats university"],
  cui: ["comsats university"],
  giki: ["ghulam ishaq khan"],
  pieas: ["pakistan institute of engineering & applied sciences", "pakistan institute of engineering and applied sciences"],
  iba: ["institute of business administration"],
  gcu: ["government college university"],
  pu: ["university of the punjab"],
  itu: ["information technology university"],
  nums: ["national university of medical sciences"],
  numl: ["national university of modern languages"],
  "air university": ["air university"],
  "bahria university": ["bahria university"],
  pide: ["pakistan institute of development economics"],
  "quaid-i-azam": ["quaid-i-azam university"],
  qau: ["quaid-i-azam university"],
  aku: ["aga khan university"],
  pu_lahore: ["university of the punjab"],
  ned: ["ned university of engineering"],
  ist: ["institute of space technology"],
};

// Preferred institution ordering for common queries (by canonical id in dataset)
// These are used to sort results when all else is equal
const PRESTIGE_IDS: string[] = [
  "uni_138", // NUST
  "uni_134", // FAST/NUCES Islamabad
  "uni_111", // LUMS
  "uni_32",  // COMSATS Islamabad
  "uni_5",   // Air University
  "uni_150", // PIEAS
  "uni_163", // QAU
  "uni_226", // UET Taxila
  "uni_224", // UET Lahore (2)
  "uni_223", // UET Peshawar
  "uni_18",  // Bahria University
  "uni_84",  // IIU
];

export type QueryIntentType = "GREETING" | "SCHOLARSHIP" | "COMPARISON" | "SEARCH" | "OUT_OF_DOMAIN";

export interface QueryIntent {
  type: QueryIntentType;
  detectedCity?: string;
  detectedDegree?: string;
  detectedUniversities?: string[];
  isLowFee?: boolean;
}

/**
 * Extract all university alias keys mentioned in a query string.
 * Handles compound aliases like "uet taxila" before simple "uet".
 */
function extractMentionedAliases(q: string): string[] {
  const mentioned: string[] = [];
  // Check compound aliases first (longer matches take priority)
  const sortedKeys = Object.keys(ALIAS_MAP).sort((a, b) => b.length - a.length);
  const matched = new Set<string>();

  for (const key of sortedKeys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(q)) {
      // Avoid double-counting sub-aliases (e.g. "uet taxila" should not also add "uet")
      const isSubsumedByLonger = mentioned.some(m => m.includes(key) && m.length > key.length);
      if (!isSubsumedByLonger && !matched.has(key)) {
        mentioned.push(key);
        matched.add(key);
      }
    }
  }
  return mentioned;
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
    "computer science", "software engineering", "artificial intelligence",
    "data science", "cyber security", "electrical engineering", "mechanical engineering",
    "civil engineering", "mbbs", "bds", "pharm-d", "nursing", "business administration",
    "accounting", "finance", "economics", "law", "llb", "psychology", "fine arts", "architecture"
  ];
  // Also check short abbreviations with strict word boundary
  const disciplineAbbreviations: Record<string, string> = {
    "\\bcs\\b": "computer science",
    "\\bse\\b": "software engineering",
    "\\bai\\b": "artificial intelligence",
    "\\bds\\b": "data science",
    "\\bbba\\b": "business administration",
  };
  let detectedDegree = disciplines.find(d => q.includes(d));
  if (!detectedDegree) {
    for (const [pattern, degree] of Object.entries(disciplineAbbreviations)) {
      if (new RegExp(pattern, "i").test(q)) {
        detectedDegree = degree;
        break;
      }
    }
  }

  // Detect specific university acronyms/names from the query
  const detectedUniversities = extractMentionedAliases(q);

  const isLowFee = q.includes("cheap") || q.includes("low fee") || q.includes("affordable") || q.includes("کم فیس") || q.includes("low cost") || q.includes("under");

  if (isComparison) {
    return { type: "COMPARISON", detectedCity, detectedDegree, detectedUniversities, isLowFee };
  }

  if (isScholarship) {
    return { type: "SCHOLARSHIP", detectedCity, detectedDegree, detectedUniversities, isLowFee };
  }

  return { type: "SEARCH", detectedCity, detectedDegree, detectedUniversities, isLowFee };
}

/**
 * Given a list of alias keys extracted from the query and all universities,
 * return pinned University objects that must always appear in results.
 * For "uet" without city disambiguation, return ALL UET variants (Lahore, Taxila, Peshawar).
 */
function resolvePinnedUniversities(aliases: string[], allUniversities: University[]): University[] {
  const pinned: University[] = [];
  const pinnedIds = new Set<string>();

  for (const alias of aliases) {
    const searchStrings = ALIAS_MAP[alias] || [];
    for (const searchStr of searchStrings) {
      const matches = allUniversities.filter(u =>
        u.name.toLowerCase().includes(searchStr.toLowerCase()) && !pinnedIds.has(u.id)
      );
      for (const m of matches) {
        pinned.push(m);
        pinnedIds.add(m.id);
      }
      if (matches.length > 0) break; // Take first matching search string per alias
    }
  }

  return pinned;
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

  // Greeting: return a welcome response without database dumping
  if (intent.type === "GREETING") {
    return {
      results: [],
      contextSummary: "Student has initiated a greeting. Provide a warm, encouraging welcome in English and Urdu, explain what guidance you can provide (fees, admissions, scholarships, comparisons), and suggest 3 sample questions.",
      citedIds: [],
      intent
    };
  }

  // COMPARISON: Guarantee the explicitly named universities always appear
  if (intent.type === "COMPARISON" && intent.detectedUniversities && intent.detectedUniversities.length > 0) {
    const pinned = resolvePinnedUniversities(intent.detectedUniversities, allUniversities);

    // Sort pinned by prestige/quality (PRESTIGE_IDS ordering)
    pinned.sort((a, b) => {
      const ai = PRESTIGE_IDS.indexOf(a.id);
      const bi = PRESTIGE_IDS.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    const topK6 = pinned.slice(0, 6);
    const contextLines = topK6.map((u, idx) => buildContextLine(u, idx));
    const contextSummary = contextLines.join("\n\n");

    return {
      results: topK6,
      contextSummary,
      citedIds: topK6.map(u => u.id),
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

  const isPublicQuery = queryLower.includes("public") || queryLower.includes("government") || queryLower.includes("سرکاری");
  const isPrivateQuery = queryLower.includes("private") || queryLower.includes("پرائیویٹ");
  const isScholarshipQuery = intent.type === "SCHOLARSHIP";
  const isLowFeeQuery = intent.isLowFee;
  const isTopQuery = queryLower.includes("top") || queryLower.includes("best") || queryLower.includes("ranked") || queryLower.includes("famous") || queryLower.includes("بہترین");

  // Pinned universities from explicit alias mentions (for SEARCH queries that name specific universities)
  const pinnedFromAliases = intent.detectedUniversities && intent.detectedUniversities.length > 0
    ? resolvePinnedUniversities(intent.detectedUniversities, allUniversities)
    : [];
  const pinnedIds = new Set(pinnedFromAliases.map(u => u.id));

  // Score all documents
  const scoredDocs = typedEmbeddings.vectorizedIndex.map(doc => {
    const uni = uniMap.get(doc.id);
    if (!uni) return { id: doc.id, score: -1 };

    // Pinned universities from explicit alias mentions: give them guaranteed high score
    if (pinnedIds.has(doc.id)) {
      return { id: doc.id, score: 99 };
    }

    const effectiveCity = filters?.city && filters.city !== "all" && filters.city !== "All"
      ? filters.city
      : intent.detectedCity;

    if (effectiveCity && uni.city.toLowerCase() !== effectiveCity.toLowerCase()) {
      return { id: doc.id, score: -1 };
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

    // Cosine Vector Similarity
    let dotProduct = 0;
    Object.keys(queryVector).forEach(term => {
      if (doc.vector[term]) {
        dotProduct += queryVector[term] * doc.vector[term];
      }
    });

    const cosSim = (queryNorm > 0 && doc.norm > 0) ? (dotProduct / (queryNorm * doc.norm)) : 0;
    let boost = 1.0;

    // Discipline match boost
    if (intent.detectedDegree && uni.programs && uni.programs.some(p =>
      p.toLowerCase().includes(intent.detectedDegree!.toLowerCase())
    )) {
      boost += 0.6;
    }

    // Top/Best query: boost known prestige institutions
    if (isTopQuery) {
      const prestigeRank = PRESTIGE_IDS.indexOf(uni.id);
      if (prestigeRank !== -1) {
        boost += (PRESTIGE_IDS.length - prestigeRank) * 0.2;
      }
    }

    // Sector boost
    if (isPublicQuery && uni.type === "Public") boost += 0.4;
    if (isPrivateQuery && uni.type === "Private") boost += 0.4;

    // Scholarship boost
    if (isScholarshipQuery && (uni.has_hec_scholarship || uni.has_usaid_scholarship)) {
      boost += 0.8;
    }

    // Low fee boost
    if (isLowFeeQuery && uni.fee_range_max <= 150000) {
      boost += 0.6;
    }

    // A budget is a hard constraint, not a weak ranking preference.
    if (filters?.maxFee && filters.maxFee > 0) {
      if (uni.fee_range_max > filters.maxFee) {
        return { id: doc.id, score: -1 };
      }
    }

    if (filters?.degree && filters.degree !== "all" && filters.degree !== "All" && !uni.programs.some(program => program.toLowerCase().includes(filters.degree!.toLowerCase()))) {
      return { id: doc.id, score: -1 };
    }
    if (filters?.category && filters.category !== "all" && filters.category !== "All" && !uni.category.toLowerCase().includes(filters.category.toLowerCase())) {
      return { id: doc.id, score: -1 };
    }
    if (filters?.distanceEducation && !uni.distance_education) return { id: doc.id, score: -1 };

    // Avoid returning arbitrary institutions when the query has no lexical match.
    const finalScore = cosSim > 0.015 ? cosSim * boost : 0;
    return { id: doc.id, score: finalScore };
  });

  // Sort descending, exclude negatives
  const validScored = scoredDocs
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);

  const topUnis: University[] = [];
  const seenIds = new Set<string>();

  for (const item of validScored) {
    if (topUnis.length >= topK) break;
    const u = uniMap.get(item.id);
    if (u && !seenIds.has(u.id)) {
      topUnis.push(u);
      seenIds.add(u.id);
    }
  }

  // Smart backfill when fewer than topK results found. Every backfill still honours
  // active user filters; generic queries deliberately return no fabricated matches.
  if (topUnis.length < topK) {
    // Scholarship backfill
    if (isScholarshipQuery) {
      for (const u of allUniversities) {
        if (topUnis.length >= topK) break;
        if ((u.has_hec_scholarship || u.has_usaid_scholarship) && !seenIds.has(u.id) && (!filters?.maxFee || u.fee_range_max <= filters.maxFee)) {
          topUnis.push(u);
          seenIds.add(u.id);
        }
      }
    }

    // City backfill - prefer prestige institutions
    if (intent.detectedCity) {
      const cityUnis = allUniversities
        .filter(u => u.city.toLowerCase() === intent.detectedCity!.toLowerCase() && !seenIds.has(u.id) && (!filters?.maxFee || u.fee_range_max <= filters.maxFee))
        .sort((a, b) => {
          const ai = PRESTIGE_IDS.indexOf(a.id);
          const bi = PRESTIGE_IDS.indexOf(b.id);
          if (ai === -1 && bi === -1) return a.fee_range_max - b.fee_range_max;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });

      for (const u of cityUnis) {
        if (topUnis.length >= topK) break;
        topUnis.push(u);
        seenIds.add(u.id);
      }
    }

    // Low fee backfill
    if (isLowFeeQuery) {
      for (const u of allUniversities) {
        if (topUnis.length >= topK) break;
        if (u.type === "Public" && u.fee_range_max <= 100000 && !seenIds.has(u.id) && (!filters?.maxFee || u.fee_range_max <= filters.maxFee)) {
          topUnis.push(u);
          seenIds.add(u.id);
        }
      }
    }
  }

  const contextLines = topUnis.map((u, idx) => buildContextLine(u, idx));
  const contextSummary = contextLines.join("\n\n");
  const citedIds = topUnis.map(u => u.id);

  return {
    results: topUnis,
    contextSummary,
    citedIds,
    intent
  };
}

function buildContextLine(u: University, idx: number): string {
  const scholarshipText = [
    u.has_hec_scholarship ? "HEC Need-Based flag in local dataset - verify current eligibility and coverage" : "",
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
}
