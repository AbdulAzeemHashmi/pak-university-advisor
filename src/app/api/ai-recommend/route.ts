import { NextRequest, NextResponse } from "next/server";
import { fetchUniversities } from "@/lib/db";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function cleanTextForHumanFormat(text: string): string {
  return text
    // Remove standalone horizontal rule lines like --- or *** or ___
    .replace(/^[\s\-\*_]{3,}$/gm, "")
    // Remove any remaining triple hyphens ---
    .replace(/---/g, "")
    // Replace en dash (– / \u2013) and em dash (— / \u2014) with space hyphen space
    .replace(/[\u2013\u2014]/g, " - ")
    // Remove markdown headers #, ##, ###, ####
    .replace(/^#+\s*/gm, "")
    // Remove asterisks used for bold/italic/bullets (* or **)
    .replace(/\*{1,2}/g, "")
    // Clean up duplicate hyphens or weird trailing dash spacing
    .replace(/\s+-\s+-+/g, " - ")
    // Clean up excessive blank lines (more than 2 newlines in a row)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, location, degree, academicMarks } = body;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();
    const current = requestCounts.get(ip);
    if (current && current.resetAt > now && current.count >= 10) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    requestCounts.set(ip, current && current.resetAt > now
      ? { count: current.count + 1, resetAt: current.resetAt }
      : { count: 1, resetAt: now + 60 * 60 * 1000 });

    if (location !== undefined && (typeof location !== "string" || location.length > 80)) {
      return NextResponse.json({ error: "Location is invalid." }, { status: 422 });
    }
    if (degree !== undefined && (typeof degree !== "string" || degree.length > 100)) {
      return NextResponse.json({ error: "Degree is invalid." }, { status: 422 });
    }
    if (academicMarks !== undefined && (typeof academicMarks !== "string" || academicMarks.length > 100)) {
      return NextResponse.json({ error: "Academic marks are invalid." }, { status: 422 });
    }

    const numBudget = Number(budget) || 250000;
    if (numBudget < 0 || numBudget > 100000000) {
      return NextResponse.json({ error: "Budget is outside the supported range." }, { status: 422 });
    }
    const locStr = location || "Lahore";
    const degStr = degree || "Computer Science";
    const marksStr = academicMarks ? `(Academic Record: ${academicMarks})` : "";

    // Query dataset to ground the AI response
    const searchData = await fetchUniversities({
      city: locStr !== "All" ? locStr : undefined,
      degree: degStr !== "All" ? degStr : undefined,
      maxFee: numBudget,
      limit: 5
    });

    const matchingNames = searchData.results.map(u => `${u.name} (${u.city}) - Fee: PKR ${u.fee_range_max.toLocaleString()}/yr`).join("\n- ");
    const scholarshipNames = searchData.scholarshipOptions?.slice(0, 3).map(u => `${u.name} (${u.city}) - ${u.scholarship_programs.join(", ")}`).join("\n- ");

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (openRouterApiKey) {
      try {
        const prompt = `You are Pak University Advisor, an expert career counselor for Pakistani students.
Student Profile:
- Annual Fee Budget: PKR ${numBudget.toLocaleString()}
- Preferred Location: ${locStr}
- Preferred Field of Study: ${degStr}
${marksStr}

Database Matches within budget:
${matchingNames ? "- " + matchingNames : "No direct fee match under PKR " + numBudget.toLocaleString()}

Available Scholarship Options:
${scholarshipNames ? "- " + scholarshipNames : "HEC Need-Based and USAID MNBSP Grants"}

CRITICAL FORMATTING INSTRUCTION: Do NOT use markdown symbols like '#', '##', '###', do NOT use asterisks '*' or '**', and do NOT use en dashes (–) or em dashes (—). Present all recommendations like clean human-written text.

Please provide a helpful, encouraging, and structured recommendation in TWO sections:
1. English Section: Clear analysis, top 2-3 university recommendations, fee structure, and scholarship advice.
2. Urdu Section (اردو میں تفصیلی مشورہ): The exact same recommendation written in clear, natural Urdu.`;

        const openRouterResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pak-university-advisor.vercel.app",
            "X-Title": "Pak University Advisor"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-001:free",
            messages: [
              { role: "system", content: "You are an empathetic, knowledgeable university guidance counselor for Pakistani students. You never use markdown heading symbols (#), bold asterisks (*), en dashes (–), or em dashes (—)." },
              { role: "user", content: prompt }
            ]
          })
        });

        if (openRouterResp.ok) {
          const aiData = await openRouterResp.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            return NextResponse.json({ recommendation: cleanTextForHumanFormat(content) });
          }
        }
      } catch (err) {
        console.warn("OpenRouter API error fallback:", err);
      }
    }

    // Heuristic bilingual fallback response if API key is not present or OpenRouter call fails
    const englishText = `🎓 Personalized Academic Recommendation

Based on your budget of PKR ${numBudget.toLocaleString()} / year for ${degStr} in ${locStr}:

${searchData.results.length > 0 ? `Recommended Institutions within Budget:
${searchData.results.slice(0, 3).map(u => `• ${u.name} (${u.city}) - Annual Fee: PKR ${u.fee_range_max.toLocaleString()} [${u.type} Sector]`).join('\n')}` : `💡 Scholarship Options Available:
Your budget of PKR ${numBudget.toLocaleString()} is below average private tuition. However, you are eligible for 100% Tuition Waivers at:
${(searchData.scholarshipOptions || []).slice(0, 3).map(u => `• ${u.name} (${u.city}) - Offers ${u.scholarship_programs.join(' & ')}`).join('\n')}`}

📌 Next Steps & Financial Aid Action Plan:
1. Apply for the HEC Need-Based Scholarship Program which covers full tuition and a monthly PKR 6,000 stipend.
2. If eligible, apply for the USAID Merit & Needs-Based Scholarship Program (MNBSP).
3. Keep track of admission testing dates (NTS NAT / ECAT / MDCAT).`;

    const urduText = `🎓 آپ کی تعلیمی اور مالیاتی رہنمائی

آپ کے سالانہ بجٹ ${numBudget.toLocaleString()} پاکستانی روپے، شعبہ ${degStr} اور مقام ${locStr} کے لیے تفصیلی تجزیہ:

${searchData.results.length > 0 ? `آپ کے بجٹ کے مطابق بہترین یونیورسٹیاں:
${searchData.results.slice(0, 3).map(u => `• ${u.name} (${u.city}) - سالانہ فیس: ${u.fee_range_max.toLocaleString()} روپے [${u.type === 'Public' ? 'سرکاری' : 'پرائیویٹ'}]`).join('\n')}` : `💡 ۱۰۰٪ مفت تعلیم اور اسکالرشپ کے اختیارات:
آپ کا طے شدہ بجٹ پرائیویٹ فیس سے کم ہے، لیکن پریشان نہ ہوں! مندرجہ ذیل اداروں میں مکمل اسکالرشپ دستیاب ہے:
${(searchData.scholarshipOptions || []).slice(0, 3).map(u => `• ${u.name} (${u.city}) - ${u.has_hec_scholarship ? 'ایچ ای سی نیڈ بیسڈ اسکالرشپ' : 'یو ایس ایڈ اسکالرشپ'}`).join('\n')}`}

📌 ضروری ہدایات:
۱. ایچ ای سی (HEC) نیڈ بیسڈ اسکالرشپ کے لیے فائنینشل ایڈ آفس سے فوری رابطہ کریں۔
۲. ۱۰۰٪ ٹیوشن فیس کے ساتھ ماہانہ وظیفہ بھی فراہم کیا جائے گا۔
۳. این ٹی ایس (NTS) اور یونیورسٹی کے اینٹری ٹیسٹ کی تیاری شروع کریں۔`;

    const combinedRecommendation = `${englishText}\n\n${urduText}`;

    return NextResponse.json({ recommendation: cleanTextForHumanFormat(combinedRecommendation) });
  } catch (error) {
    console.error("Error in /api/ai-recommend:", error);
    return NextResponse.json({ error: "Failed to generate AI recommendation" }, { status: 500 });
  }
}
