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
}
