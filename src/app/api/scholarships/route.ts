import { NextRequest, NextResponse } from "next/server";
import { fetchScholarshipUniversities } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || undefined;
    const degree = searchParams.get("degree") || undefined;

    const universities = await fetchScholarshipUniversities(city, degree);

    return NextResponse.json({
      total: universities.length,
      universities
    });
  } catch (error) {
    console.error("Error in /api/scholarships:", error);
    return NextResponse.json({ error: "Failed to fetch scholarships" }, { status: 500 });
  }
}
