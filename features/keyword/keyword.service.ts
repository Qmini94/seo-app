import { fetchRelatedKeywords } from "@/infrastructure/naver/search-ad.client";
import type { RelatedKeyword } from "./keyword.types";

export async function getRelatedKeywords(seed: string): Promise<RelatedKeyword[]> {
  const raw = await fetchRelatedKeywords(seed);

  return raw.map((k) => ({
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
  }));
}
