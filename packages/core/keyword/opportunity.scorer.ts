/**
 * 기회 점수 산출기
 * 수요 × (1 - 경쟁도) × 관련성 가중합으로 종합 기회 점수를 산출한다.
 *
 * 공식: opportunity = demand × (1 - competition) × relevance
 *
 * - demand: 월간 검색량을 0~1로 정규화 (로그 스케일)
 * - competition: 높음=0.9, 중간=0.5, 낮음=0.1
 * - relevance: 0~100을 0~1로 변환
 *
 * 결과: 0~100 점수 (높을수록 기회 큼)
 */

import type { Competition } from "./keyword.types";

const competitionWeight: Record<Competition, number> = {
  높음: 0.9,
  중간: 0.5,
  낮음: 0.1,
};

/**
 * 검색량을 0~1로 정규화 (로그 스케일)
 * 검색량 분포가 극단적으로 치우쳐 있어서 로그 스케일 적용.
 * 10 이하 → ~0, 100 → ~0.33, 1000 → ~0.5, 10000 → ~0.67, 100000 → ~0.83
 */
function normalizeDemand(searchVolume: number, maxVolume: number): number {
  if (searchVolume <= 0 || maxVolume <= 0) return 0;
  const logValue = Math.log10(searchVolume + 1);
  const logMax = Math.log10(maxVolume + 1);
  return logMax > 0 ? logValue / logMax : 0;
}

interface OpportunityInput {
  monthlyTotalSearch: number;
  competition: Competition;
  relevance: number;
}

/**
 * 기회 점수 산출 (0~100)
 * @param keyword - 개별 키워드 데이터
 * @param maxSearchVolume - 현재 결과 내 최대 검색량 (정규화 기준)
 */
export function scoreOpportunity(keyword: OpportunityInput, maxSearchVolume: number): number {
  const demand = normalizeDemand(keyword.monthlyTotalSearch, maxSearchVolume);
  const competition = competitionWeight[keyword.competition] ?? 0.5;
  const relevance = keyword.relevance / 100;

  const raw = demand * (1 - competition) * relevance * 100;

  return Math.round(Math.min(100, Math.max(0, raw)));
}
