/**
 * 검색 의도 분류기
 * 접미사/포함 패턴 기반으로 키워드의 검색 의도를 분류한다.
 *
 * 4가지 의도:
 * - informational (정보형): "~방법", "~원인", "~뜻" — 정보를 알고 싶다
 * - commercial (상업형): "~추천", "~비교", "~순위" — 구매 전 비교/조사
 * - transactional (거래형): "~가격", "~구매", "~할인" — 바로 구매/행동
 * - navigational (탐색형): "~공식", "~홈페이지", "~로그인" — 특정 사이트 찾기
 */

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export const INTENT_LABEL: Record<SearchIntent, string> = {
  informational: "정보형",
  commercial: "상업형",
  transactional: "거래형",
  navigational: "탐색형",
};

interface PatternRule {
  intent: SearchIntent;
  patterns: string[];
}

const RULES: PatternRule[] = [
  {
    intent: "transactional",
    patterns: [
      "가격", "비용", "견적", "구매", "주문", "예약", "신청",
      "할인", "쿠폰", "무료", "이벤트", "프로모션",
      "배송", "설치", "시술", "수술",
    ],
  },
  {
    intent: "commercial",
    patterns: [
      "추천", "비교", "순위", "랭킹", "TOP", "베스트",
      "후기", "리뷰", "평가", "장단점", "차이",
      "VS", "어디", "어떤", "괜찮",
    ],
  },
  {
    intent: "navigational",
    patterns: [
      "공식", "홈페이지", "사이트", "로그인", "회원가입",
      "고객센터", "전화번호", "위치", "영업시간", "매장",
    ],
  },
  {
    intent: "informational",
    patterns: [
      "방법", "하는법", "원인", "이유", "증상", "효과", "효능",
      "뜻", "의미", "종류", "차이점", "특징",
      "부작용", "주의사항", "기간", "과정",
      "란", "이란", "인가", "일까",
      "어떻게", "왜", "무엇", "언제",
    ],
  },
];

export function classifyIntent(keyword: string): SearchIntent {
  const normalized = keyword.toLowerCase().replace(/\s/g, "");

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (normalized.includes(pattern.toLowerCase())) {
        return rule.intent;
      }
    }
  }

  // 매칭 없으면 기본 정보형 (검색 대부분이 정보 탐색)
  return "informational";
}
