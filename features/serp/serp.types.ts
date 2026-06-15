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

/** AI 브리핑 분석 */
export interface AiBriefingData {
  exists: boolean;
  citedUrls: string[];
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
  textLength: number;       // 본문 글자수
  keywordCount: number;     // 키워드 출현 횟수
  keywordDensity: number;   // 키워드 밀도 (%)
  titleLength: number;      // 제목 글자수
  h2Count: number;          // H2 소제목 수
  h3Count: number;          // H3 소제목 수
  imageCount: number;       // 이미지 수
  contentType: ContentType; // 콘텐츠 형태
}

export type ContentType = "list" | "table" | "faq" | "step" | "general";

/** 콘텐츠 처방전 */
export interface ContentPrescription {
  keyword: string;
  recommendedChannel: string;
  aiBriefing: {
    active: boolean;
    citedCount: number;
  };
  spec: {
    titleLength: { min: number; max: number; avg: number };
    bodyLength: { min: number; avg: number };
    keywordUsage: { min: number; max: number; density: { min: number; max: number } };
    h2Count: { min: number; max: number };
    imageCount: { min: number; avg: number };
    contentType: ContentType;
  };
  channelDistribution: Record<string, number>;
  benchmarkCount: number;
}
