import { NextRequest, NextResponse } from "next/server";
import { getMediaDetails } from "@/lib/providers";
import type { MediaType } from "@/config/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const mediaType = type as MediaType;

  try {
    const details = await getMediaDetails(id, mediaType);

    if (!details) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("Media details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media details" },
      { status: 500 }
    );
  }
}
