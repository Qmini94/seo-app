/** SERP 영역 타입 */
export type SerpSectionType =
  | "blog"
  | "cafe"
  | "web"
  | "news"
  | "shopping"
  | "kin"        // 지식iN
  | "ai_briefing"
  | "place"
  | "image"
  | "video"
  | "unknown";

export const SECTION_LABEL: Record<SerpSectionType, string> = {
  blog: "블로그",
  cafe: "카페",
  web: "웹사이트",
  news: "뉴스",
  shopping: "쇼핑",
  kin: "지식iN",
  ai_briefing: "AI 브리핑",
  place: "플레이스",
  image: "이미지",
  video: "동영상",
  unknown: "기타",
};

/** SERP 개별 결과 */
export interface SerpResult {
  rank: number;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

/** SERP 영역 */
export interface SerpSection {
  type: SerpSectionType;
  position: number; // 페이지 내 노출 순서
  results: SerpResult[];
}

/** AI 브리핑 개별 인용 소스 */
export interface AiBriefingSource {
  url: string;
  domain: string;
  title: string;
  aiDescription: string; // AI가 생성한 사이트 설명
}

/** AI 브리핑 분석 */
export interface AiBriefingData {
  exists: boolean;
  citedUrls: string[];
  sources: AiBriefingSource[];
  /** web_gen 영역 존재 여부 (AI 생성 검색결과) */
  hasWebGen: boolean;
}

/** SERP 전체 분석 결과 */
export interface SerpAnalysis {
  keyword: string;
  sections: SerpSection[];
  aiBriefing: AiBriefingData;
  totalSections: number;
  dominantChannel: SerpSectionType | null; // 가장 많은 결과를 가진 채널
}

/** 콘텐츠 구조 분석 */
export interface ContentStructure {
  url: string;
  domain: string;           // 도메인
  textLength: number;       // 본문 글자수
  keywordCount: number;     // 키워드 출현 횟수
  keywordDensity: number;   // 키워드 밀도 (%)
  titleLength: number;      // 제목 글자수
  h2Count: number;          // H2 소제목 수
  h3Count: number;          // H3 소제목 수
  imageCount: number;       // 이미지 수
  contentType: ContentType; // 콘텐츠 형태
  aiCited: boolean;         // AI 브리핑에 인용되었는지
}

export type ContentType = "list" | "table" | "faq" | "step" | "general";

/** 콘텐츠 처방전 */
export interface ContentPrescription {
  keyword: string;
  recommendedChannel: string;
  aiBriefing: {
    active: boolean;
    citedCount: number;
    hasWebGen: boolean;
    sources: AiBriefingSource[];
  };
  spec: {
    titleLength: { min: number; max: number; avg: number };
    bodyLength: { min: number; avg: number };
    keywordUsage: { min: number; max: number; density: { min: number; max: number } };
    h2Count: { min: number; max: number };
    imageCount: { min: number; avg: number };
    contentType: ContentType;
  };
  /** AI 인용 콘텐츠 vs 일반 상위 콘텐츠 비교 */
  aiCitedBenchmark: AiCitedComparison | null;
  channelDistribution: Record<string, number>;
  benchmarkCount: number;
}

/** AI 인용 콘텐츠와 일반 상위 콘텐츠의 구조 차이 */
export interface AiCitedComparison {
  citedCount: number;
  nonCitedCount: number;
  /** AI 인용된 콘텐츠의 평균 지표 */
  cited: {
    avgTextLength: number;
    avgKeywordDensity: number;
    avgH2Count: number;
    avgImageCount: number;
    dominantType: ContentType;
  };
  /** 일반 상위 콘텐츠의 평균 지표 */
  nonCited: {
    avgTextLength: number;
    avgKeywordDensity: number;
    avgH2Count: number;
    avgImageCount: number;
    dominantType: ContentType;
  };
  /** AI가 선호하는 패턴 요약 */
  patterns: string[];
}

/** ISR 처방전 — AI 브리핑 인용 최적화 가이드 */
export interface IsrPrescription {
  keyword: string;
  /** AI 브리핑 활성 여부 */
  aiBriefingActive: boolean;
  /** ISR 난이도 (AI가 이미 인용 중인 경쟁 강도) */
  difficulty: "easy" | "moderate" | "hard";
  /** 콘텐츠 구조 권장 스펙 */
  contentSpec: {
    /** 권장 본문 길이 (글자 수) */
    bodyLength: { min: number; recommended: number };
    /** 권장 소제목(H2) 수 */
    h2Count: { min: number; recommended: number };
    /** 권장 이미지 수 */
    imageCount: { min: number; recommended: number };
    /** 키워드 밀도 (%) */
    keywordDensity: { min: number; max: number };
    /** 권장 콘텐츠 형태 */
    contentType: ContentType;
  };
  /** ISR 전략 항목들 */
  strategies: IsrStrategy[];
  /** 콘텐츠 작성 체크리스트 */
  checklist: string[];
  /** AI 인용 패턴 기반 인사이트 (Claude 분석 결과 통합) */
  aiInsights: {
    commonTraits: string[];
    recommendations: string[];
    preferredFormat: string;
    commonExpressions: string[];
  } | null;
}

/** ISR 전략 항목 */
export interface IsrStrategy {
  category: "structure" | "content" | "authority" | "format";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}
