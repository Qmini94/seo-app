import type { SearchIntent } from "./intent.classifier";

export interface RelatedKeyword {
  keyword: string;
  monthlyPcSearch: number;
  monthlyMobileSearch: number;
  monthlyTotalSearch: number;
  competition: string; // 높음 / 중간 / 낮음
  monthlyAvePcClick: number;
  monthlyAveMobileClick: number;
  monthlyAveTotalClick: number;
  pcCtr: number;
  mobileCtr: number;
  intent: SearchIntent;
  relevance: number; // 0~100, 시드 대비 관련성
}
