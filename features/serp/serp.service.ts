import { crawlNaverSerp, crawlContentPage } from "@/infrastructure/crawler/serp.crawler";
import { parseSerpHtml } from "./serp.parser";
import { analyzeContent } from "./content.analyzer";
import { generatePrescription } from "./prescription.generator";
import type { SerpAnalysis, ContentStructure, ContentPrescription } from "./serp.types";

const MAX_CONTENT_CRAWL = 5; // 상위 5개만 크롤링 (비용 제어)
const CRAWL_DELAY_MS = 1000; // 크롤링 간 딜레이 (차단 방지)

/**
 * 키워드에 대한 SERP 분석을 수행한다.
 * 1) 네이버 통합검색 크롤링 → HTML 파싱
 * 2) 상위 콘텐츠 개별 크롤링 → 구조 분석
 * 3) 처방전 생성
 */
export async function analyzeSerpForKeyword(keyword: string): Promise<{
  serpAnalysis: SerpAnalysis;
  contentStructures: ContentStructure[];
  prescription: ContentPrescription;
}> {
  // 1) SERP 크롤링 + 파싱
  const serpHtml = await crawlNaverSerp(keyword);
  const serpAnalysis = parseSerpHtml(keyword, serpHtml);

  // 2) 상위 콘텐츠 URL 수집 (블로그/웹/카페에서)
  const contentUrls = collectContentUrls(serpAnalysis);

  // 3) 상위 콘텐츠 개별 크롤링 + 분석
  const contentStructures: ContentStructure[] = [];
  for (const url of contentUrls.slice(0, MAX_CONTENT_CRAWL)) {
    try {
      const html = await crawlContentPage(url);
      const structure = analyzeContent(url, html, keyword);
      // 본문이 너무 짧으면 크롤링 실패로 간주
      if (structure.textLength > 100) {
        contentStructures.push(structure);
      }
    } catch {
      // 개별 크롤링 실패는 무시하고 다음 URL 진행
    }
    await delay(CRAWL_DELAY_MS);
  }

  // 4) 처방전 생성
  const prescription = generatePrescription(serpAnalysis, contentStructures);

  return { serpAnalysis, contentStructures, prescription };
}

/** SERP에서 콘텐츠 URL을 수집한다 (블로그/웹/카페 우선) */
function collectContentUrls(serp: SerpAnalysis): string[] {
  const contentTypes = ["blog", "web", "cafe"];
  const urls: string[] = [];

  for (const type of contentTypes) {
    for (const section of serp.sections) {
      if (section.type === type) {
        for (const result of section.results) {
          if (result.url && !urls.includes(result.url)) {
            urls.push(result.url);
          }
        }
      }
    }
  }

  return urls;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
