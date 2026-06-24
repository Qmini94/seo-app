import type { SearchIntent } from "./intent.classifier";

export type Competition = "높음" | "중간" | "낮음";

export interface RelatedKeyword {
  keyword: string;
  monthlyPcSearch: number;
  monthlyMobileSearch: number;
  monthlyTotalSearch: number;
  competition: Competition;
  monthlyAvePcClick: number;
  monthlyAveMobileClick: number;
  monthlyAveTotalClick: number;
  pcCtr: number;
  mobileCtr: number;
  intent: SearchIntent;
  relevance: number; // 0~100, 시드 대비 관련성
  opportunity: number; // 0~100, 종합 기회 점수
}
