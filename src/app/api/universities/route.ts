import { NextRequest, NextResponse } from "next/server";
import { fetchUniversities } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city") || undefined;
    const province = searchParams.get("province") || undefined;
    const degree = searchParams.get("degree") || undefined;
    const category = searchParams.get("category") || undefined;
    const distanceEducation = searchParams.get("distanceEducation") === "true";
    const maxFeeStr = searchParams.get("maxFee");
    const type = (searchParams.get("type") as "Public" | "Private" | "all") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const maxFee = maxFeeStr ? Number(maxFeeStr) : undefined;
    const requestedPage = pageStr ? Number(pageStr) : 1;
    const requestedLimit = limitStr ? Number(limitStr) : 12;
    if ((maxFee !== undefined && (!Number.isFinite(maxFee) || maxFee < 0)) || !Number.isInteger(requestedPage) || requestedPage < 1 || !Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return NextResponse.json({ error: "Invalid pagination or fee filter." }, { status: 422 });
    }
    const page = requestedPage;
    const limit = Math.min(requestedLimit, 50);

    const data = await fetchUniversities({
      city,
      province,
      degree,
      category,
      distanceEducation,
      maxFee,
      type,
      searchQuery,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/universities:", error);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}
