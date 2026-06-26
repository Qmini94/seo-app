import { fetchRelatedKeywords, type NaverKeywordRaw } from "@infra/naver";
import { classifyIntent } from "./intent.classifier";
import { scoreRelevance } from "./relevance.scorer";
import { scoreOpportunity } from "./opportunity.scorer";
import type { RelatedKeyword } from "./keyword.types";

export async function getRelatedKeywords(seed: string): Promise<RelatedKeyword[]> {
  const raw = await fetchRelatedKeywords(seed);
  return enrichKeywords(raw, seed);
}

/**
 * AI 생성 시드 키워드 목록을 검색광고 API로 일괄 검증한다.
 *
 * - 시드 5개씩 배치로 네이버 API 호출 (API 제한 대응)
 * - 검색량 0인 키워드 탈락
 * - 기회 점수 산출 후 내림차순 정렬
 *
 * @param seeds - AI가 생성한 시드 키워드 목록
 * @param businessContext - 업종/서비스 요약 (관련성 점수 기준)
 */
export async function validateAndScoreSeeds(
  seeds: { keyword: string; category: string }[],
  businessContext: string
): Promise<(RelatedKeyword & { category: string })[]> {
  // 5개씩 배치로 나눠서 API 호출
  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 300;
  const allRaw: (NaverKeywordRaw & { querySeed: string })[] = [];

  for (let i = 0; i < seeds.length; i += BATCH_SIZE) {
    const batch = seeds.slice(i, i + BATCH_SIZE);
    const batchKeywords = batch.map((s) => s.keyword).join(",");

    try {
      const raw = await fetchRelatedKeywords(batchKeywords);
      // 시드 목록에 있는 키워드만 필터 (연관 키워드는 제외)
      const seedSet = new Set(batch.map((s) => s.keyword.replace(/\s/g, "").toLowerCase()));
      for (const kw of raw) {
        const normalized = kw.keyword.replace(/\s/g, "").toLowerCase();
        if (seedSet.has(normalized)) {
          allRaw.push({ ...kw, querySeed: kw.keyword });
        }
      }
    } catch {
      // 배치 실패 시 skip하고 다음 배치 진행
    }

    if (i + BATCH_SIZE < seeds.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // 검색량 0 탈락
  const validated = allRaw.filter((k) => k.monthlyTotalSearch > 0);

  // 카테고리 매핑
  const categoryMap = new Map(
    seeds.map((s) => [s.keyword.replace(/\s/g, "").toLowerCase(), s.category])
  );

  // 기본 매핑 + 점수 산출
  const keywords = validated.map((k) => ({
    keyword: k.keyword,
    monthlyPcSearch: k.monthlyPcSearch,
    monthlyMobileSearch: k.monthlyMobileSearch,
    monthlyTotalSearch: k.monthlyTotalSearch,
    competition: k.competition,
    monthlyAvePcClick: k.monthlyAvePcClick,
    monthlyAveMobileClick: k.monthlyAveMobileClick,
    monthlyAveTotalClick: k.monthlyAveTotalClick,
    pcCtr: k.pcCtr,
    mobileCtr: k.mobileCtr,
    intent: classifyIntent(k.keyword),
    relevance: scoreRelevance(businessContext, k.keyword),
    opportunity: 0,
    category: categoryMap.get(k.keyword.replace(/\s/g, "").toLowerCase()) ?? "기타",
  }));

  // 기회 점수 산출
  const maxSearch = Math.max(...keywords.map((k) => k.monthlyTotalSearch), 1);
  for (const kw of keywords) {
    kw.opportunity = scoreOpportunity(kw, maxSearch);
  }

  // 기회 점수 내림차순 정렬
  keywords.sort((a, b) => b.opportunity - a.opportunity);

  return keywords;
}

/** 원본 데이터 → 도메인 타입 변환 + 점수 산출 */
function enrichKeywords(raw: NaverKeywordRaw[], seed: string): RelatedKeyword[] {
  const keywords = raw.map((k) => ({
    keyword: k.keyword,
    monthlyPcSearch: k.monthlyPcSearch,
    monthlyMobileSearch: k.monthlyMobileSearch,
    monthlyTotalSearch: k.monthlyTotalSearch,
    competition: k.competition,
    monthlyAvePcClick: k.monthlyAvePcClick,
    monthlyAveMobileClick: k.monthlyAveMobileClick,
    monthlyAveTotalClick: k.monthlyAveTotalClick,
    pcCtr: k.pcCtr,
    mobileCtr: k.mobileCtr,
    intent: classifyIntent(k.keyword),
    relevance: scoreRelevance(seed, k.keyword),
    opportunity: 0,
  }));

  const maxSearch = Math.max(...keywords.map((k) => k.monthlyTotalSearch), 1);
  for (const kw of keywords) {
    kw.opportunity = scoreOpportunity(kw, maxSearch);
  }

  return keywords;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
