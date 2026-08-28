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
    .replace(/[أإٱ]/g, "ا").replace(/ى/g, "ی").replace(/ك/g, "ک").replace(/ۀ/g, "ہ")
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

const QUERY_EXPANSIONS: Record<string, string[]> = {
  "comp sci": ["computer", "science"],
  cs: ["computer", "science"],
  "software dev": ["software", "engineering"],
  ai: ["artificial", "intelligence"],
  cybersecurity: ["cyber", "security"],
  sasti: ["low", "fee"],
  sasta: ["low", "fee"],
  kam: ["low", "fee"]
};

function expandQueryTokens(text: string, tokens: string[]): string[] {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const additions = Object.entries(QUERY_EXPANSIONS)
    .filter(([phrase]) => new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "i").test(normalized))
    .flatMap(([, words]) => words);
  return [...tokens, ...additions];
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

export type QueryIntentType = "GREETING" | "SCHOLARSHIP" | "COMPARISON" | "SEARCH" | "OUT_OF_DOMAIN";

export interface QueryIntent {
  type: QueryIntentType;
  detectedCity?: string;
  detectedDegree?: string;
  detectedUniversities?: string[];
  isLowFee?: boolean;
  maxFee?: number;
}

/**
 * Pull an explicit annual budget out of a student query. This deliberately only
 * accepts a number when it is paired with a budget cue, so a year such as 2026
 * is never mistaken for a fee cap.
 */
function extractMaxFee(text: string): number | undefined {
  const q = text.toLowerCase().replace(/,/g, " ");
  const lakhMatch = q.match(/(?:under|below|less than|upto|up to|within|budget|fee)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i);
  if (lakhMatch) return Math.round(Number(lakhMatch[1]) * 100_000);

  // Common Pakistani shorthand, e.g. "best universities in 30k range annually".
  const thousandMatch = q.match(/(?:under|below|less than|upto|up to|within|budget|fee|range)[^\d]{0,20}(\d+(?:\.\d+)?)\s*k\b/i)
    || q.match(/\b(\d+(?:\.\d+)?)\s*k\s*(?:range|annual(?:ly)?|per\s*year|yearly|fee|budget)\b/i);
  if (thousandMatch) return Math.round(Number(thousandMatch[1]) * 1_000);

  const pkrMatch = q.match(/(?:under|below|less than|upto|up to|within|budget|fee)[^\d]{0,20}(\d{4,7})\s*(?:pkr|rs\.?|rupees)?/i);
  if (pkrMatch) return Number(pkrMatch[1]);
  return undefined;
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
    "\\bbds\\b": "bds",
    "\\bdata\s*sci(?:ence)?\\b": "data science",
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

  const maxFee = extractMaxFee(q);
  const isLowFee = q.includes("cheap") || q.includes("low fee") || q.includes("affordable") || q.includes("کم فیس") || q.includes("low cost") || maxFee !== undefined;

  if (isComparison) {
    return { type: "COMPARISON", detectedCity, detectedDegree, detectedUniversities, isLowFee, maxFee };
  }

  if (isScholarship) {
    return { type: "SCHOLARSHIP", detectedCity, detectedDegree, detectedUniversities, isLowFee, maxFee };
  }

  return { type: "SEARCH", detectedCity, detectedDegree, detectedUniversities, isLowFee, maxFee };
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
  noReliableMatch: boolean;
  isScholarshipFallback: boolean;
}

function matchesActiveConstraints(uni: University, intent: QueryIntent, filters: SearchFilters | undefined, maxFee: number | undefined): boolean {
  const city = filters?.city && !["all", "All"].includes(filters.city) ? filters.city : intent.detectedCity;
  if (city && uni.city.toLowerCase() !== city.toLowerCase()) return false;
  if (filters?.province && !["all", "All"].includes(filters.province) && uni.province.toLowerCase() !== filters.province.toLowerCase()) return false;
  if (filters?.type && filters.type !== "all" && uni.type !== filters.type) return false;
  if (maxFee && uni.fee_range_max > maxFee) return false;
  if (filters?.distanceEducation && !uni.distance_education) return false;
  const degree = filters?.degree && !["all", "All"].includes(filters.degree) ? filters.degree : intent.detectedDegree;
  if (degree && !uni.programs.some(program => program.toLowerCase().includes(degree.toLowerCase()))) return false;
  if (filters?.category && !["all", "All"].includes(filters.category) && !uni.category.toLowerCase().includes(filters.category.toLowerCase())) return false;
  return true;
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
      intent,
      noReliableMatch: false,
      isScholarshipFallback: false
    };
  }

  // COMPARISON: Guarantee the explicitly named universities always appear
  if (intent.type === "COMPARISON" && intent.detectedUniversities && intent.detectedUniversities.length > 0) {
    const comparisonMaxFee = [filters?.maxFee, intent.maxFee]
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
      .reduce<number | undefined>((minimum, value) => minimum === undefined ? value : Math.min(minimum, value), undefined);
    const pinned = resolvePinnedUniversities(intent.detectedUniversities, allUniversities)
      .filter(uni => matchesActiveConstraints(uni, intent, filters, comparisonMaxFee));

    const topK6 = pinned.slice(0, 6);
    const contextLines = topK6.map((u, idx) => buildContextLine(u, idx));
    const contextSummary = contextLines.join("\n\n");

    return {
      results: topK6,
      contextSummary,
      citedIds: topK6.map(u => u.id),
      intent,
      noReliableMatch: topK6.length === 0,
      isScholarshipFallback: false
    };
  }

  const tokens = expandQueryTokens(query, tokenizeQuery(query));

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
  const effectiveMaxFee = [filters?.maxFee, intent.maxFee]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    .reduce<number | undefined>((minimum, value) => minimum === undefined ? value : Math.min(minimum, value), undefined);
  // Pinned universities from explicit alias mentions (for SEARCH queries that name specific universities)
  const pinnedFromAliases = intent.detectedUniversities && intent.detectedUniversities.length > 0
    ? resolvePinnedUniversities(intent.detectedUniversities, allUniversities)
    : [];
  const pinnedIds = new Set(pinnedFromAliases.map(u => u.id));

  // Score all documents
  const scoredDocs = typedEmbeddings.vectorizedIndex.map(doc => {
    const uni = uniMap.get(doc.id);
    if (!uni) return { id: doc.id, score: -1 };

    if (!matchesActiveConstraints(uni, intent, filters, effectiveMaxFee)) return { id: doc.id, score: -1 };

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

    // Pinned universities from explicit aliases still honour explicit constraints.
    if (pinnedIds.has(doc.id)) return { id: doc.id, score: 99 };

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
        if ((u.has_hec_scholarship || u.has_usaid_scholarship) && !seenIds.has(u.id) && matchesActiveConstraints(u, intent, filters, effectiveMaxFee)) {
          topUnis.push(u);
          seenIds.add(u.id);
        }
      }
    }

    // City backfill - prefer prestige institutions
    if (intent.detectedCity) {
      const cityUnis = allUniversities
        .filter(u => !seenIds.has(u.id) && matchesActiveConstraints(u, intent, filters, effectiveMaxFee))
        .sort((a, b) => a.fee_range_max - b.fee_range_max || a.name.localeCompare(b.name));

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
        if (u.type === "Public" && u.fee_range_max <= 100000 && !seenIds.has(u.id) && matchesActiveConstraints(u, intent, filters, effectiveMaxFee)) {
          topUnis.push(u);
          seenIds.add(u.id);
        }
      }
    }
  }

  // Direct retrieval respects the fee cap. If it finds nothing, retry only with
  // explicitly flagged need-based scholarship providers, preserving every other
  // active constraint (city, programme, sector, category and study mode).
  const isScholarshipFallback = topUnis.length === 0 && effectiveMaxFee !== undefined;
  if (isScholarshipFallback) {
    const scholarshipOptions = allUniversities
      .filter(u => (u.has_hec_scholarship || u.has_usaid_scholarship)
        && matchesActiveConstraints(u, intent, filters, undefined))
      .sort((a, b) => a.fee_range_max - b.fee_range_max || a.name.localeCompare(b.name));

    for (const university of scholarshipOptions.slice(0, topK)) {
      topUnis.push(university);
      seenIds.add(university.id);
    }
  }

  const noReliableMatch = topUnis.length === 0;
  const contextLines = topUnis.map((u, idx) => buildContextLine(u, idx));
  const contextSummary = noReliableMatch
    ? "NO RETRIEVED RECORDS. Do not name, rank, or make claims about a university. Ask the student for a city, program, sector, or exact institution name."
    : `${isScholarshipFallback
      ? "BUDGET FALLBACK: No university matched the student's fee cap. The following records are need-based scholarship opportunities, not guaranteed admission or funding. Explain that eligibility, award coverage, and deadlines must be verified with the financial-aid office.\n\n"
      : ""}${contextLines.join("\n\n")}`;
  const citedIds = topUnis.map(u => u.id);

  return {
    results: topUnis,
    contextSummary,
    citedIds,
    intent,
    noReliableMatch,
    isScholarshipFallback
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
- Data reliability: Fee, program, and contact fields may be estimated or inferred in this local dataset; do not present them as current official facts.
- Scholarships: ${scholarshipText || "Institutional Aid via Financial Aid Office"}
- Financial Aid Office / Details: ${u.financial_aid_office || "Contact Admissions Office"} - ${u.scholarship_details || ""}
- Programs Offered: ${u.programs.join(", ")}
- Website: ${u.website || "N/A"}`;
}
