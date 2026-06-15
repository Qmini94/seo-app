/**
 * 관련성 점수 산출기
 * 시드 키워드 대비 연관 키워드의 의미적 거리를 0~100으로 산출한다.
 *
 * 산출 기준:
 * 1. 시드 토큰 포함 여부 (가장 중요)
 * 2. 시드 토큰 포함 비율 (복합 시드일 때)
 * 3. 키워드 길이 패널티 (너무 길면 노이즈 가능성)
 */

/**
 * 시드를 의미 단위 토큰으로 분리한다.
 * "전세자금대출" → ["전세", "자금", "대출"]
 * "피부과" → ["피부과"]
 *
 * 한국어 형태소 분석 없이 2~3글자 n-gram + 전체 시드로 처리.
 * 1차 패턴 기반이라 완벽하지 않지만, 실용적으로 충분하다.
 */
function tokenize(seed: string): string[] {
  const cleaned = seed.replace(/\s/g, "");

  // 짧은 시드(3글자 이하)는 그 자체가 토큰
  if (cleaned.length <= 3) return [cleaned];

  const tokens: string[] = [cleaned]; // 전체 시드도 포함

  // 2글자 단위로 슬라이딩
  for (let i = 0; i <= cleaned.length - 2; i++) {
    tokens.push(cleaned.slice(i, i + 2));
  }

  // 3글자 단위로 슬라이딩
  for (let i = 0; i <= cleaned.length - 3; i++) {
    tokens.push(cleaned.slice(i, i + 3));
  }

  return [...new Set(tokens)];
}

/**
 * 관련성 점수 산출 (0~100)
 *
 * @param seed - 시드 키워드
 * @param keyword - 연관 키워드
 * @returns 0~100 점수 (높을수록 관련성 높음)
 */
export function scoreRelevance(seed: string, keyword: string): number {
  const cleanSeed = seed.replace(/\s/g, "").toLowerCase();
  const cleanKeyword = keyword.replace(/\s/g, "").toLowerCase();

  // 완전 일치 → 100점
  if (cleanSeed === cleanKeyword) return 100;

  // 시드 전체가 키워드에 포함 → 높은 기본점
  const containsFull = cleanKeyword.includes(cleanSeed);

  // 토큰별 포함 비율
  const tokens = tokenize(cleanSeed);
  const matchedTokens = tokens.filter((t) => cleanKeyword.includes(t));
  const tokenRatio = matchedTokens.length / tokens.length;

  // 길이 패널티: 키워드가 시드보다 많이 길면 감점
  const lengthRatio = cleanSeed.length / cleanKeyword.length;
  const lengthPenalty = lengthRatio > 1 ? 1 : Math.max(0.3, lengthRatio);

  let score = 0;

  if (containsFull) {
    // 시드 전체 포함: 70~95점 범위
    score = 70 + lengthPenalty * 25;
  } else if (tokenRatio > 0) {
    // 부분 토큰 매칭: 토큰 비율 × 70
    score = tokenRatio * 70 * lengthPenalty;
  }
  // 매칭 없음: 0점

  return Math.round(Math.min(100, Math.max(0, score)));
}
