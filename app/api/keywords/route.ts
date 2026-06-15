import { NextResponse } from "next/server";
import { getRelatedKeywords } from "@/features/keyword/keyword.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "키워드를 입력해주세요. (q 파라미터 필수)" },
      { status: 400 }
    );
  }

  if (!process.env.NAVER_AD_API_KEY || !process.env.NAVER_AD_SECRET_KEY || !process.env.NAVER_AD_CUSTOMER_ID) {
    return NextResponse.json(
      { error: "네이버 검색광고 API 환경변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    const keywords = await getRelatedKeywords(q);
    return NextResponse.json({ seed: q, count: keywords.length, keywords });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isNaverError = message.includes("Naver SearchAd API");
    return NextResponse.json(
      { error: isNaverError ? message : "서버 오류가 발생했습니다." },
      { status: isNaverError ? 502 : 500 }
    );
  }
}