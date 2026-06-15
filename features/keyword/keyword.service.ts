import { fetchRelatedKeywords } from "@/infrastructure/naver/search-ad.client";
import { classifyIntent } from "./intent.classifier";
import { scoreRelevance } from "./relevance.scorer";
import { scoreOpportunity } from "./opportunity.scorer";
import type { RelatedKeyword } from "./keyword.types";

export async function getRelatedKeywords(seed: string): Promise<RelatedKeyword[]> {
  const raw = await fetchRelatedKeywords(seed);

  // 1차: 기본 매핑 + 의도 분류 + 관련성 점수
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
    opportunity: 0, // 2차에서 산출
  }));

  // 2차: 기회 점수 산출 (전체 최대 검색량 기준 정규화)
  const maxSearch = Math.max(...keywords.map((k) => k.monthlyTotalSearch), 1);
  for (const kw of keywords) {
    kw.opportunity = scoreOpportunity(kw, maxSearch);
  }

  return keywords;
}
