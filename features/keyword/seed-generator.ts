import { askClaudeJson } from "@/infrastructure/ai/claude.client";

export interface BusinessProfile {
  industry: string;      // 업종 (예: "보일러 시공")
  region: string;        // 지역 (예: "포항")
  services: string[];    // 주요 서비스 (예: ["보일러 교체", "난방배관 수리"])
  targetCustomer?: string; // 타겟 고객 (예: "아파트 주민, 상가 건물주")
}

interface GeneratedSeeds {
  seeds: {
    keyword: string;
    category: string; // 어떤 관점에서 생성했는지
  }[];
}

const SYSTEM_PROMPT = `당신은 네이버 SEO 키워드 전문가입니다.
고객의 업종/지역/서비스 정보를 받아서, 네이버에서 실제로 검색될 만한 시드 키워드를 생성합니다.

규칙:
1. 실제 사람들이 네이버에 검색할 법한 자연스러운 키워드만 생성
2. 다양한 검색 의도를 커버 (정보형, 상업형, 거래형)
3. 지역명 포함/미포함 키워드 모두 생성
4. 시즌/상황별 키워드 포함
5. 경쟁사 고객이 검색할 키워드 포함
6. 너무 일반적이거나 검색량이 없을 것 같은 키워드는 제외
7. 30~50개 범위로 생성

카테고리 분류:
- 지역+업종: 지역명과 업종 조합
- 서비스별: 개별 서비스 관련
- 비용/견적: 가격, 비용, 견적 관련
- 비교/추천: 업체 비교, 추천, 후기
- 문제/해결: 고객이 겪는 문제와 해결 검색
- 시즌/상황: 계절, 특정 상황 관련
- 정보탐색: 방법, 종류, 주의사항 등

반드시 JSON 형식으로 응답하세요.`;

function buildUserMessage(profile: BusinessProfile): string {
  let msg = `업종: ${profile.industry}\n지역: ${profile.region}\n`;
  msg += `주요 서비스: ${profile.services.join(", ")}\n`;
  if (profile.targetCustomer) {
    msg += `타겟 고객: ${profile.targetCustomer}\n`;
  }
  msg += `\n이 사업자를 위한 네이버 SEO 시드 키워드를 생성해주세요.`;
  msg += `\n\n다음 JSON 형식으로 응답:\n`;
  msg += `\`\`\`json\n{"seeds": [{"keyword": "키워드", "category": "카테고리"}]}\n\`\`\``;
  return msg;
}

/**
 * AI가 고객 프로필 기반으로 시드 키워드 후보를 생성한다.
 * 이후 검색광고 API로 검증하여 실제 검색량이 있는 것만 남긴다.
 */
export async function generateSeedKeywords(
  profile: BusinessProfile
): Promise<{ keyword: string; category: string }[]> {
  const result = await askClaudeJson<GeneratedSeeds>(
    SYSTEM_PROMPT,
    buildUserMessage(profile),
    { maxTokens: 4096 }
  );

  if (!result.seeds || !Array.isArray(result.seeds)) {
    throw new Error("AI 키워드 생성 결과가 올바르지 않습니다.");
  }

  // 중복 제거
  const seen = new Set<string>();
  return result.seeds.filter((s) => {
    const key = s.keyword.replace(/\s/g, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return s.keyword.trim().length > 0;
  });
}
