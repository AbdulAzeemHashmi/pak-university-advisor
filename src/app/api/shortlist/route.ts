import { NextRequest, NextResponse } from "next/server";
import { getShortlist, addToShortlist, removeFromShortlist } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const shortlist = await getShortlist(userId);
    return NextResponse.json({ shortlist });
  } catch (error) {
    console.error("Error in GET /api/shortlist:", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { universityId } = body;

    if (!universityId) {
      return NextResponse.json({ error: "universityId is required" }, { status: 400 });
    }

    await addToShortlist(userId, universityId);
    return NextResponse.json({ success: true, message: "University added to shortlist" });
  } catch (error) {
    console.error("Error in POST /api/shortlist:", error);
    return NextResponse.json({ error: "Failed to add to shortlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { universityId } = body;

    if (!universityId) {
      return NextResponse.json({ error: "universityId is required" }, { status: 400 });
    }

    await removeFromShortlist(userId, universityId);
    return NextResponse.json({ success: true, message: "University removed from shortlist" });
  } catch (error) {
    console.error("Error in DELETE /api/shortlist:", error);
    return NextResponse.json({ error: "Failed to remove from shortlist" }, { status: 500 });
  }
}
