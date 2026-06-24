import { crawlNaverSerp, crawlContentPage } from "@/infrastructure/crawler/serp.crawler";
import { parseSerpHtml } from "./serp.parser";
import { analyzeContent } from "./content.analyzer";
import { generatePrescription } from "./prescription.generator";
import { analyzeAiCitationPattern, type AiPatternAnalysis } from "./ai-pattern.analyzer";
import type { SerpAnalysis, ContentStructure, ContentPrescription } from "./serp.types";

const MAX_CONTENT_CRAWL = 5;   // 일반 상위 콘텐츠 최대 크롤링 수
const MAX_AI_CITED_CRAWL = 3;  // AI 인용 콘텐츠 최대 크롤링 수
const CRAWL_DELAY_MS = 2000;   // 크롤링 간 딜레이 (2초 — 차단 방지)

/**
 * 키워드에 대한 SERP 분석을 수행한다.
 *
 * 흐름:
 * 1) 네이버 통합검색 크롤링 → SERP 파싱 (섹션 구조 + AI 브리핑 인용 URL)
 * 2) 상위 콘텐츠 개별 크롤링 → 구조 분석
 * 3) AI 브리핑 인용 콘텐츠 크롤링 → 구조 분석 + aiCited 마킹
 * 4) 인용 vs 비인용 비교 포함 처방전 생성
 */
export async function analyzeSerpForKeyword(keyword: string): Promise<{
  serpAnalysis: SerpAnalysis;
  contentStructures: ContentStructure[];
  prescription: ContentPrescription;
  aiPatternAnalysis: AiPatternAnalysis | null;
}> {
  // 1) SERP 크롤링 + 파싱
  const serpHtml = await crawlNaverSerp(keyword);
  const serpAnalysis = parseSerpHtml(keyword, serpHtml);

  // AI 인용 URL 세트 (비교용)
  const aiCitedUrlSet = new Set(serpAnalysis.aiBriefing.citedUrls);

  // 2) 상위 콘텐츠 URL 수집 (블로그/웹/카페)
  const contentUrls = collectContentUrls(serpAnalysis);

  // 3) AI 인용 URL 중 상위 콘텐츠에 없는 것 추가 수집
  const aiOnlyUrls = serpAnalysis.aiBriefing.citedUrls.filter(
    (url) => !contentUrls.includes(url) && isContentUrl(url)
  );

  // 4) 상위 콘텐츠 크롤링
  const contentStructures: ContentStructure[] = [];
  const crawledUrls = new Set<string>();

  for (const url of contentUrls.slice(0, MAX_CONTENT_CRAWL)) {
    const structure = await crawlAndAnalyze(url, keyword);
    if (structure) {
      structure.aiCited = aiCitedUrlSet.has(url);
      contentStructures.push(structure);
      crawledUrls.add(url);
    }
    await delay(CRAWL_DELAY_MS);
  }

  // 5) AI 인용 전용 크롤링 (상위 콘텐츠에 없었던 것만)
  for (const url of aiOnlyUrls.slice(0, MAX_AI_CITED_CRAWL)) {
    if (crawledUrls.has(url)) continue;
    const structure = await crawlAndAnalyze(url, keyword);
    if (structure) {
      structure.aiCited = true;
      contentStructures.push(structure);
      crawledUrls.add(url);
    }
    await delay(CRAWL_DELAY_MS);
  }

  // 6) 처방전 생성
  const prescription = generatePrescription(serpAnalysis, contentStructures);

  // 7) AI 패턴 심층 분석 (Claude 활용 — AI 브리핑이 있을 때만)
  let aiPatternAnalysis: AiPatternAnalysis | null = null;
  if (serpAnalysis.aiBriefing.exists && process.env.ANTHROPIC_API_KEY) {
    aiPatternAnalysis = await analyzeAiCitationPattern(
      keyword,
      serpAnalysis.aiBriefing,
      contentStructures
    );
  }

  return { serpAnalysis, contentStructures, prescription, aiPatternAnalysis };
}

/** 개별 URL 크롤링 + 분석 (실패 시 null) */
async function crawlAndAnalyze(url: string, keyword: string): Promise<ContentStructure | null> {
  try {
    const html = await crawlContentPage(url);
    const structure = analyzeContent(url, html, keyword);
    // 본문이 너무 짧으면 크롤링 실패로 간주
    if (structure.textLength > 100) {
      return structure;
    }
  } catch {
    // 개별 크롤링 실패는 무시
  }
  return null;
}

/** SERP에서 콘텐츠 URL을 수집한다 (블로그/웹/카페 우선) */
function collectContentUrls(serp: SerpAnalysis): string[] {
  const contentTypes = ["blog", "web", "cafe"];
  const urls: string[] = [];

  for (const type of contentTypes) {
    for (const section of serp.sections) {
      if (section.type === type) {
        for (const result of section.results) {
          if (result.url && isContentUrl(result.url) && !urls.includes(result.url)) {
            urls.push(result.url);
          }
        }
      }
    }
  }

  return urls;
}

/** 크롤링 가능한 콘텐츠 URL인지 판별 */
function isContentUrl(url: string): boolean {
  if (!url.startsWith("http")) return false;
  // 네이버 내부 페이지, 지도, 검색 등은 제외
  const excludePatterns = [
    "search.naver.com",
    "map.naver.com",
    "keep.naver.com",
    "help.naver.com",
    "mail.naver.com",
    "in.naver.com",
    "mate.naver.com",
    "kin.naver.com",    // 지식iN은 구조가 달라 별도 처리 필요
    "cafe.naver.com",   // 카페는 로그인 필요한 경우 많음
  ];
  return !excludePatterns.some((p) => url.includes(p));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
