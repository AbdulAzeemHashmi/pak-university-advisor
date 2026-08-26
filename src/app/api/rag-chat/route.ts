import { NextRequest, NextResponse } from "next/server";
import { searchUniversitiesRAG } from "@/lib/rag-retrieval";
import { SearchFilters } from "@/types";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function cleanTextForHumanFormat(text: string): string {
  return text
    .replace(/^[\s\-\*_]{3,}$/gm, "")
    .replace(/---/g, "")
    .replace(/[\u2013\u2014]/g, " - ")
    .replace(/^#+\s*/gm, "")
    .replace(/\*{1,2}/g, "")
    .replace(/\s+-\s+-+/g, " - ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, filters } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      filters?: SearchFilters;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message is too long (max 1000 characters)." }, { status: 400 });
    }

    // Rate Limiting (max 15 requests per hour per IP)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();
    const current = requestCounts.get(ip);
    if (current && current.resetAt > now && current.count >= 15) {
      return NextResponse.json({ error: "Too many requests. Please try again in an hour." }, { status: 429 });
    }
    requestCounts.set(ip, current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + 60 * 60 * 1000 });

    // Step 1: Perform RAG Vector + Metadata Hybrid Retrieval
    const ragResult = await searchUniversitiesRAG(message, filters, 5);
    const { results: citedUniversities, contextSummary } = ragResult;

    // Step 2: Build LLM Messages with RAG Grounding Context
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (openRouterApiKey) {
      try {
        const systemPrompt = `You are Pak University Advisor, an expert career and admissions counselor for Pakistani students.
Your mission is to provide helpful, encouraging, accurate, and fact-grounded recommendations.

RETRIEVED FACTUAL KNOWLEDGE BASE:
${contextSummary}

CRITICAL FORMATTING INSTRUCTION:
- Do NOT use markdown headers like '#', '##', '###', '####'.
- Do NOT use asterisks '*' or '**' for bolding/italics.
- Do NOT use en dashes (–) or em dashes (—). Use standard hyphens or clean bullets (•).
- Provide a clear, natural, structured response in TWO sections:
  1. English Section: Direct answer to student's query, top university recommendations with fee breakdowns and scholarship guidance.
  2. Urdu Section (اردو میں تفصیلی رہنمائی): The same advice in clear, natural Urdu.`;

        // Format recent chat history
        const formattedHistory = (history || []).slice(-4).map(h => ({
          role: h.role,
          content: h.content
        }));

        const messages = [
          { role: "system", content: systemPrompt },
          ...formattedHistory,
          { role: "user", content: message }
        ];

        const openRouterResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pak-university-advisor.vercel.app",
            "X-Title": "Pak University Advisor RAG"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-001:free",
            messages: messages,
            temperature: 0.4
          })
        });

        if (openRouterResp.ok) {
          const aiData = await openRouterResp.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            return NextResponse.json({
              recommendation: cleanTextForHumanFormat(content),
              citedUniversities,
              contextCount: citedUniversities.length
            });
          }
        }
      } catch (err) {
        console.warn("OpenRouter RAG error fallback:", err);
      }
    }

    // Heuristic Fallback RAG response if OpenRouter is unavailable
    const englishLines = citedUniversities.map((u, i) =>
      `${i + 1}. ${u.name} (${u.city}) - Max Annual Fee: PKR ${u.fee_range_max.toLocaleString()} [${u.type} Sector]
   Programs: ${u.programs.slice(0, 4).join(", ")}
   Scholarships: ${u.has_hec_scholarship ? "HEC Need-Based Available" : u.has_usaid_scholarship ? "USAID MNBSP Available" : "Financial Aid Office Available"}`
    ).join("\n\n");

    const urduLines = citedUniversities.map((u, i) =>
      `${i + 1}. ${u.name} (${u.city}) - سالانہ فیس: ${u.fee_range_max.toLocaleString()} روپے
   اسکالرشپ: ${u.has_hec_scholarship ? "ایچ ای سی نیڈ بیسڈ اسکالرشپ" : "مالیاتی امداد دفتر سے رجوع کریں"}`
    ).join("\n\n");

    const fallbackEnglish = `🎓 RAG Grounded University Search & Advice\n\nQuery: "${message}"\n\nTop Grounded Database Matches:\n\n${englishLines}\n\n📌 Recommended Action Plan:\n1. Verify specific departmental fee structure with the university financial aid office.\n2. Apply early for HEC Need-Based Scholarships or institutional fee waivers.\n3. Track upcoming admission & entry test dates.`;

    const fallbackUrdu = `🎓 آپ کی تلاش کے مطابق بہترین یونیورسٹیاں\n\nتلاش: "${message}"\n\nڈیٹا بیس کی تصدیق شدہ یونیورسٹیاں:\n\n${urduLines}\n\n📌 ضروری ہدایات:\n۱. داخلہ فارم کے ساتھ ایچ ای سی (HEC) اسکالرشپ فارم لازمی جمع کرائیں۔\n۲. این ٹی ایس (NTS) یا یونیورسٹی انٹری ٹیسٹ کی بروقت تیاری کریں۔`;

    const combinedFallback = `${fallbackEnglish}\n\n${fallbackUrdu}`;

    return NextResponse.json({
      recommendation: cleanTextForHumanFormat(combinedFallback),
      citedUniversities,
      contextCount: citedUniversities.length
    });
  } catch (error) {
    console.error("Error in /api/rag-chat:", error);
    return NextResponse.json({ error: "Failed to generate RAG response" }, { status: 500 });
  }
}
