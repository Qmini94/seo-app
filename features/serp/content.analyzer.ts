import * as cheerio from "cheerio";
import type { ContentStructure, ContentType } from "./serp.types";
import { extractDomain } from "./parsers/base.parser";

/**
 * 상위 콘텐츠 페이지 HTML을 분석하여 구조 데이터를 추출한다.
 *
 * 분석 항목:
 * - 본문 글자수, 키워드 출현 횟수/밀도
 * - 제목 길이, H2/H3 소제목 수
 * - 이미지 수, 콘텐츠 형태 분류
 */
export function analyzeContent(url: string, html: string, keyword: string): ContentStructure {
  const $ = cheerio.load(html);

  // 불필요 요소 제거
  $("script, style, nav, header, footer, .comment, #comment").remove();

  const title = extractTitle($);
  const bodyText = extractBodyText($);
  const keywordCount = countKeyword(bodyText, keyword);
  const wordCount = countWords(bodyText);
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const imageCount = countContentImages($);

  const contentType = classifyContentType($, bodyText);

  return {
    url,
    domain: extractDomain(url),
    textLength: bodyText.length,
    keywordCount,
    keywordDensity: wordCount > 0 ? Math.round((keywordCount / wordCount) * 10000) / 100 : 0,
    titleLength: title.length,
    h2Count,
    h3Count,
    imageCount,
    contentType,
    aiCited: false, // 호출자가 설정
  };
}

/**
 * 콘텐츠 이미지만 카운트 (UI/아이콘/트래커/스페이서 제외)
 *
 * 네이버 블로그에는 1px 스페이서, 배너, 프로필, 이모티콘 등
 * 콘텐츠와 무관한 img 태그가 수십~수백 개 있어서 정밀 필터링 필요.
 */
function countContentImages($: cheerio.CheerioAPI): number {
  // 네이버 블로그: 본문 영역 내부 이미지만 카운트
  const $content =
    $(".se-main-container").length > 0 ? $(".se-main-container") :
    $("#postViewArea").length > 0 ? $("#postViewArea") :
    $(".post_ct").length > 0 ? $(".post_ct") :
    $("article").length > 0 ? $("article") :
    $("main").length > 0 ? $("main") :
    $("body");

  return $content.find("img").filter((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-lazy-src") ?? "";
    if (!src || src.startsWith("data:")) return false;

    // UI/트래커/아이콘 패턴 제외
    const excludePatterns = [
      "pixel", "icon", "logo", "btn", "badge", "emoticon",
      "spc.gif", "blank.gif", "spacer", "widget",
      "static.naver", "ssl.pstatic.net/static",
      "blogimgs.pstatic.net/nblog", // 블로그 UI 이미지
    ];
    if (excludePatterns.some((p) => src.includes(p))) return false;

    // 너무 작은 이미지 제외 (80px 미만)
    const width = parseInt($(el).attr("width") ?? "0") || 0;
    const height = parseInt($(el).attr("height") ?? "0") || 0;
    if ((width > 0 && width < 80) || (height > 0 && height < 80)) return false;

    return true;
  }).length;
}

/** 제목 추출 (og:title > title 태그 > h1) */
function extractTitle($: cheerio.CheerioAPI): string {
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle) return ogTitle.trim();

  const titleTag = $("title").text().trim();
  if (titleTag) return titleTag;

  return $("h1").first().text().trim();
}

/** 본문 텍스트 추출 */
function extractBodyText($: cheerio.CheerioAPI): string {
  // 네이버 블로그 본문 영역
  const blogContent =
    $(".se-main-container").text() ||  // 스마트에디터
    $("#postViewArea").text() ||        // 구버전
    $(".post_ct").text();               // 포스트

  if (blogContent.trim().length > 100) {
    return cleanBodyText(blogContent);
  }

  // 일반 웹페이지: article > main > body
  const article = $("article").text();
  if (article.trim().length > 100) return cleanBodyText(article);

  const main = $("main").text();
  if (main.trim().length > 100) return cleanBodyText(main);

  return cleanBodyText($("body").text());
}

function cleanBodyText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** 키워드 출현 횟수 (공백 무시 매칭) */
function countKeyword(text: string, keyword: string): number {
  const normalized = text.replace(/\s/g, "").toLowerCase();
  const target = keyword.replace(/\s/g, "").toLowerCase();
  if (!target) return 0;

  let count = 0;
  let pos = 0;
  while ((pos = normalized.indexOf(target, pos)) !== -1) {
    count++;
    pos += target.length;
  }
  return count;
}

/** 단어 수 (한국어는 글자수 기반, 2글자 = 1단어 근사) */
function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  // 한국어 중심이라 공백 기준 분리 + 영어 단어 카운트
  return cleaned.split(/\s+/).length;
}

/** 콘텐츠 형태 분류 */
function classifyContentType($: cheerio.CheerioAPI, bodyText: string): ContentType {
  const olCount = $("ol").length;
  const ulCount = $("ul").length;
  const tableCount = $("table").length;
  const lowerText = bodyText.toLowerCase();

  // FAQ 패턴: Q&A, 질문/답변 반복
  const faqPatterns = ["q.", "a.", "질문", "답변", "q:", "a:", "faq"];
  const faqHits = faqPatterns.filter((p) => lowerText.includes(p)).length;
  if (faqHits >= 2) return "faq";

  // 스텝 패턴: step, 1단계, 2단계...
  const stepPatterns = ["step", "단계", "순서", "방법"];
  const stepHits = stepPatterns.filter((p) => lowerText.includes(p)).length;
  if (stepHits >= 2 || (olCount >= 1 && stepHits >= 1)) return "step";

  // 표 패턴
  if (tableCount >= 2) return "table";

  // 리스트 패턴
  if (olCount + ulCount >= 3) return "list";

  return "general";
}

/**
 * 여러 콘텐츠 분석 결과의 평균/범위를 계산한다.
 */
export function aggregateBenchmarks(structures: ContentStructure[]) {
  if (structures.length === 0) return null;

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);

  const textLengths = structures.map((s) => s.textLength);
  const keywordCounts = structures.map((s) => s.keywordCount);
  const densities = structures.map((s) => s.keywordDensity);
  const titleLengths = structures.map((s) => s.titleLength);
  const h2Counts = structures.map((s) => s.h2Count);
  const imageCounts = structures.map((s) => s.imageCount);

  // 가장 많은 콘텐츠 형태
  const typeCounts: Partial<Record<ContentType, number>> = {};
  for (const s of structures) {
    typeCounts[s.contentType] = (typeCounts[s.contentType] ?? 0) + 1;
  }
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0] as ContentType;

  return {
    count: structures.length,
    textLength: { min: min(textLengths), max: max(textLengths), avg: avg(textLengths) },
    keywordCount: { min: min(keywordCounts), max: max(keywordCounts), avg: avg(keywordCounts) },
    keywordDensity: { min: Math.round(min(densities) * 100) / 100, max: Math.round(max(densities) * 100) / 100, avg: Math.round(avg(densities) * 100) / 100 },
    titleLength: { min: min(titleLengths), max: max(titleLengths), avg: avg(titleLengths) },
    h2Count: { min: min(h2Counts), max: max(h2Counts), avg: avg(h2Counts) },
    imageCount: { min: min(imageCounts), max: max(imageCounts), avg: avg(imageCounts) },
    dominantType,
  };
}
