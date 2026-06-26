import { NextResponse } from "next/server";
import { generateSeedKeywords, type BusinessProfile, validateAndScoreSeeds } from "@core/keyword";

export async function POST(req: Request) {
  let body: BusinessProfile;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!body.industry?.trim() || !body.region?.trim() || !body.services?.length) {
    return NextResponse.json(
      { error: "업종, 지역, 주요 서비스를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  if (!process.env.NAVER_AD_API_KEY || !process.env.NAVER_AD_SECRET_KEY || !process.env.NAVER_AD_CUSTOMER_ID) {
    return NextResponse.json(
      { error: "네이버 검색광고 API 환경변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    // 1) AI가 시드 키워드 생성
    const seeds = await generateSeedKeywords(body);

    // 2) 검색광고 API로 일괄 검증 + 점수 산출
    const businessContext = `${body.region} ${body.industry} ${body.services.join(" ")}`;
    const validated = await validateAndScoreSeeds(seeds, businessContext);

    return NextResponse.json({
      profile: body,
      generated: seeds.length,
      validated: validated.length,
      keywords: validated,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `키워드 추천 실패: ${message}` }, { status: 500 });
  }
}
