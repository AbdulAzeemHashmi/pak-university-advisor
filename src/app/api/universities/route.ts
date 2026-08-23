import { NextRequest, NextResponse } from "next/server";
import { fetchUniversities } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city") || undefined;
    const province = searchParams.get("province") || undefined;
    const degree = searchParams.get("degree") || undefined;
    const maxFeeStr = searchParams.get("maxFee");
    const type = (searchParams.get("type") as "Public" | "Private" | "all") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const maxFee = maxFeeStr ? parseInt(maxFeeStr, 10) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 12;

    const data = await fetchUniversities({
      city,
      province,
      degree,
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
