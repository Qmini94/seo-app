import { NextResponse } from "next/server";
import { getRelatedKeywords } from "@/services/naver/searchAd";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "전세자금대출";

  try {
    const keywords = await getRelatedKeywords(q);
    return NextResponse.json({ seed: q, count: keywords.length, keywords });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}