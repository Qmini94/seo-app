import * as cheerio from "cheerio";
import type { Element } from "domhandler";
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
  $("script, style, nav, footer, .comment, #comment, .se-module-sticker, .se-module-oglink").remove();

  const title = extractTitle($);
  const bodyText = extractBodyText($);
  const keywordCount = countKeyword(bodyText, keyword);
  const wordCount = countWords(bodyText);
  const h2Count = countHeadings($, "h2");
  const h3Count = countHeadings($, "h3");
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
 * 콘텐츠 이미지만 카운트 (UI/아이콘/트래커/스페이서/스티커 제외)
 *
 * 네이버 블로그에는 1px 스페이서, 배너, 프로필, 이모티콘, 스티커 등
 * 콘텐츠와 무관한 img 태그가 수십~수백 개 있어서 정밀 필터링 필요.
 */
function countContentImages($: cheerio.CheerioAPI): number {
  // 네이버 블로그 스마트에디터: se-module-image 안의 이미지만 카운트 (가장 정확)
  const seImageModules = $(".se-module-image img, .se-module-imageStrip img");
  if (seImageModules.length > 0) {
    return seImageModules.filter((_, el) => isContentImage($, el)).length;
  }

  // 네이버 블로그 구버전: postViewArea 안의 이미지
  const $postView = $("#postViewArea");
  if ($postView.length > 0) {
    return $postView.find("img").filter((_, el) => isContentImage($, el)).length;
  }

  // 일반 웹페이지: 본문 영역 안의 이미지
  const $content =
    $("article").length > 0 ? $("article") :
    $("main").length > 0 ? $("main") :
    $(".content, #content, .post-content, .entry-content").first();

  const $scope = $content.length > 0 ? $content : $("body");

  return $scope.find("img").filter((_, el) => isContentImage($, el)).length;
}

/** 개별 img가 콘텐츠 이미지인지 판별 */
function isContentImage($: cheerio.CheerioAPI, el: Element): boolean {
  const src = $(el).attr("src") ?? $(el).attr("data-lazy-src") ?? $(el).attr("data-src") ?? "";
  if (!src || src.startsWith("data:")) return false;

  // UI/트래커/아이콘 패턴 제외
  const excludePatterns = [
    "pixel", "icon", "logo", "btn", "badge", "emoticon", "sticker",
    "spc.gif", "blank.gif", "spacer", "widget", "banner", "ad_",
    "static.naver", "ssl.pstatic.net/static",
    "blogimgs.pstatic.net/nblog",   // 블로그 UI 이미지
    "phinf.pstatic.net/contact",    // 프로필 이미지
    "dthumb-phinf",                 // 썸네일 서비스
    "github.com",                   // README 뱃지 등
    ".svg",                         // 보통 아이콘
    "/emoji/",
    "/profile/",
    "/avatar/",
  ];
  if (excludePatterns.some((p) => src.toLowerCase().includes(p))) return false;

  // 너무 작은 이미지 제외 (100px 미만)
  const width = parseInt($(el).attr("width") ?? "0") || 0;
  const height = parseInt($(el).attr("height") ?? "0") || 0;
  if ((width > 0 && width < 100) || (height > 0 && height < 100)) return false;

  // CSS class로 UI 이미지 제외
  const className = $(el).attr("class") ?? "";
  const uiClasses = ["icon", "logo", "profile", "avatar", "emoji", "sticker"];
  if (uiClasses.some((c) => className.toLowerCase().includes(c))) return false;

  return true;
}

/** 제목 추출 (og:title > title 태그 > h1) — 사이트명 접미사 제거 */
function extractTitle($: cheerio.CheerioAPI): string {
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle && ogTitle.trim().length > 2) return cleanTitle(ogTitle.trim());

  const titleTag = $("title").text().trim();
  if (titleTag && titleTag.length > 2) return cleanTitle(titleTag);

  const h1 = $("h1").first().text().trim();
  if (h1) return h1;

  // 네이버 블로그 제목
  const blogTitle = $(".se-title-text").text().trim() || $(".pcol1").text().trim();
  if (blogTitle) return blogTitle;

  return "";
}

/** 제목에서 사이트명 접미사 제거 (예: "글제목 - 네이버 블로그") */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|:·]\s*(네이버\s*블로그|네이버\s*포스트|Naver|Blog)$/i, "")
    .replace(/\s*[-|:·]\s*[^-|:·]{1,20}$/, (match) => {
      // 접미사가 너무 짧으면 (사이트명) 제거, 아니면 유지
      return match.trim().length < 15 ? "" : match;
    })
    .trim();
}

/** 본문 텍스트 추출 — 외부에서도 사용 */
export function extractBodyText($: cheerio.CheerioAPI): string {
  // 네이버 블로그 본문 영역 (스마트에디터 텍스트 컴포넌트만)
  const seTexts = $(".se-main-container .se-module-text");
  if (seTexts.length > 0) {
    const texts: string[] = [];
    seTexts.each((_, el) => {
      const text = $(el).text().trim();
      if (text) texts.push(text);
    });
    const combined = texts.join(" ");
    if (combined.length > 100) return cleanBodyText(combined);
  }

  // 네이버 블로그 구버전
  const postView = $("#postViewArea").text();
  if (postView && postView.trim().length > 100) return cleanBodyText(postView);

  // 네이버 포스트
  const postCt = $(".post_ct").text();
  if (postCt && postCt.trim().length > 100) return cleanBodyText(postCt);

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

/**
 * 키워드 출현 횟수 (공백 무시 매칭 + 부분 키워드 매칭)
 *
 * "포항 카페추천" → "포항카페추천" 전체 매칭 + "포항" / "카페추천" 개별 매칭
 * 최종 값은 전체 매칭 우선, 0이면 부분 키워드 최소 출현 수 사용
 */
function countKeyword(text: string, keyword: string): number {
  const normalized = text.replace(/\s/g, "").toLowerCase();
  const target = keyword.replace(/\s/g, "").toLowerCase();
  if (!target) return 0;

  // 1) 전체 키워드 매칭
  const fullCount = countOccurrences(normalized, target);
  if (fullCount > 0) return fullCount;

  // 2) 공백으로 분리된 부분 키워드 매칭 (전체 매칭 0일 때)
  const parts = keyword.trim().split(/\s+/).filter((p) => p.length >= 2);
  if (parts.length <= 1) return 0;

  // 각 부분 키워드 출현 횟수 중 최소값 = 키워드 조합이 함께 나타난 횟수 근사
  const partCounts = parts.map((p) => countOccurrences(normalized, p.toLowerCase()));
  return Math.min(...partCounts);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

/** 단어 수 (한국어는 글자수 기반, 2글자 = 1단어 근사) */
function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

/** 소제목 카운트 (본문 영역 내부만) */
function countHeadings($: cheerio.CheerioAPI, tag: string): number {
  // 네이버 블로그: se-main-container 내부만
  if ($(".se-main-container").length > 0) {
    return $(".se-main-container").find(tag).length;
  }
  if ($("#postViewArea").length > 0) {
    return $("#postViewArea").find(tag).length;
  }

  // 일반 웹페이지
  const $scope =
    $("article").length > 0 ? $("article") :
    $("main").length > 0 ? $("main") :
    $("body");

  return $scope.find(tag).length;
}

/** 콘텐츠 형태 분류 */
function classifyContentType($: cheerio.CheerioAPI, bodyText: string): ContentType {
  const $scope =
    $(".se-main-container").length > 0 ? $(".se-main-container") :
    $("article").length > 0 ? $("article") :
    $("main").length > 0 ? $("main") :
    $("body");

  const olCount = $scope.find("ol").length;
  const ulCount = $scope.find("ul").length;
  const tableCount = $scope.find("table").length;
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
