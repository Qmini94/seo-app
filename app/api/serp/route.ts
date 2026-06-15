import { NextResponse } from "next/server";
import { analyzeSerpForKeyword } from "@/features/serp/serp.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword")?.trim();

  if (!keyword) {
    return NextResponse.json(
      { error: "키워드를 입력해주세요. (keyword 파라미터 필수)" },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeSerpForKeyword(keyword);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `SERP 분석 실패: ${message}` },
      { status: 500 }
    );
  }
}
