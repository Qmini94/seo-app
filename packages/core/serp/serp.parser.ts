import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpAnalysis, SerpSection, SerpSectionType } from "./serp.types";
import { extractAiBriefingData } from "./parsers/ai-briefing.parser";
import { extractDomain, cleanText } from "./parsers/base.parser";

/**
 * 네이버 SERP 섹션 타입 매핑 (실제 DOM 기준 2026-06)
 *
 * 네이버 통합검색은 Fender 렌더링 시스템을 사용하며,
 * 각 섹션은 data-block-id와 data-meta-ssuid로 식별된다.
 */
const SSUID_TO_TYPE: Record<string, SerpSectionType> = {
  review: "blog",       // 블로그 리뷰 (review/prs_template_v2_review_blog_rra)
  web: "web",           // 웹사이트
  news: "news",         // 뉴스
  kin: "kin",           // 지식iN
  image: "image",       // 이미지
  video: "video",       // 동영상
  influencer: "blog",   // 인플루언서 (블로그 계열)
  qra: "kin",           // Q&A (지식iN 계열)
};

const BLOCK_ID_TO_TYPE: Record<string, SerpSectionType> = {
  review: "blog",
  web: "web",
  news: "news",
  kin: "kin",
  image: "image",
  video: "video",
  aipick: "blog",      // AI 피크 (인플루언서)
  ugc: "blog",          // UGC (인플루언서)
  qra: "kin",
};

/**
 * SERP HTML을 파싱하여 영역별 구조를 분석한다.
 *
 * 네이버 Fender 렌더링 시스템 기반:
 * - .sc_new[data-fender-root] 섹션을 순회
 * - data-meta-ssuid 또는 data-block-id의 prefix로 타입 결정
 * - 광고 섹션(ad_section), 플레이스(loc_plc)도 처리
 */
export function parseSerpHtml(keyword: string, html: string): SerpAnalysis {
  const $ = cheerio.load(html);
  const sections: SerpSection[] = [];
  let position = 1;

  // #main_pack 내 Fender 렌더링 섹션 순회
  $("#main_pack .sc_new").each((_, el) => {
    const $section = $(el);

    // 광고 섹션 스킵
    if ($section.hasClass("ad_section")) return;

    // 섹션 타입 결정
    const type = identifySectionType($section);
    if (!type) return;

    // AI 브리핑은 별도 처리 (extractAiBriefingData에서 수집)
    if (type === "ai_briefing") return;

    // 결과 추출
    const results = extractResults($section, $, type);
    if (results.length > 0) {
      sections.push({ type, position: position++, results });
    }
  });

  // 플레이스 섹션 (data-laim-exp-id="loc_plc")
  $('#main_pack .sc_new[data-laim-exp-id="loc_plc"]').each((_, el) => {
    const $section = $(el);
    const results = extractPlaceResults($section, $);
    if (results.length > 0) {
      sections.push({ type: "place", position: position++, results });
    }
  });

  // AI 브리핑 별도 추출
  const aiBriefing = extractAiBriefingData($);

  // 가장 많은 결과를 가진 채널
  const dominantChannel = findDominantChannel(sections);

  return {
    keyword,
    sections,
    aiBriefing,
    totalSections: sections.length,
    dominantChannel,
  };
}

/** data-meta-ssuid / data-block-id 기반 섹션 타입 결정 */
function identifySectionType($section: cheerio.Cheerio<AnyNode>): SerpSectionType | null {
  // 1) data-meta-ssuid로 매칭
  const ssuid = $section.attr("data-meta-ssuid") ?? "";
  if (ssuid && SSUID_TO_TYPE[ssuid]) {
    // web_gen 영역은 AI 브리핑으로 분류
    const area = $section.attr("data-meta-area") ?? "";
    if (area === "web_gen") return "ai_briefing";
    return SSUID_TO_TYPE[ssuid];
  }

  // 2) data-block-id의 prefix로 매칭
  const blockId = $section.attr("data-block-id") ?? "";
  const blockPrefix = blockId.split("/")[0];
  if (blockPrefix && BLOCK_ID_TO_TYPE[blockPrefix]) {
    return BLOCK_ID_TO_TYPE[blockPrefix];
  }

  // 3) 텍스트에 "AI 출처 정보" 포함 시 AI 브리핑
  const text = $section.text();
  if (text.includes("AI 출처 정보") || text.includes("AI를 활용해 제공하는")) {
    return "ai_briefing";
  }

  // 4) 레거시 fallback — class/heading 기반
  const className = $section.attr("class") ?? "";
  const heading = $section.find(".api_title, .tit_area, h2").text();

  if (heading.includes("쇼핑")) return "shopping";
  if (heading.includes("플레이스")) return "place";
  if ($section.attr("data-laim-exp-id") === "loc_plc") return "place";

  return null;
}

/** Fender 렌더링 섹션에서 링크 결과 추출 */
function extractResults(
  $section: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  type: SerpSectionType
): { rank: number; title: string; url: string; domain: string; snippet?: string }[] {
  const results: { rank: number; title: string; url: string; domain: string; snippet?: string }[] = [];
  const seen = new Set<string>();
  let rank = 1;

  // Fender 구조: 각 결과 카드는 .title_url_area 또는 직접 a 태그로 구성
  $section.find("a[href]").each((_, el) => {
    const $el = $(el);
    const url = $el.attr("href") ?? "";
    const title = cleanText($el.text());

    if (
      !url.startsWith("http") ||
      url.includes("search.naver.com") ||
      url.includes("keep.naver.com") ||
      url.includes("help.naver.com") ||
      !title ||
      title.length < 3 ||
      seen.has(url)
    ) {
      return;
    }

    // 블로그: blog.naver.com, post.naver.com 우선
    if (type === "blog" && !url.includes("blog") && !url.includes("post") && !url.includes("influencer")) {
      // 리뷰 섹션은 블로그 외 URL도 포함 가능
    }

    seen.add(url);
    results.push({
      rank: rank++,
      title,
      url,
      domain: extractDomain(url),
    });
  });

  return results;
}

/** 플레이스 결과 추출 */
function extractPlaceResults(
  $section: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): { rank: number; title: string; url: string; domain: string }[] {
  const results: { rank: number; title: string; url: string; domain: string }[] = [];
  let rank = 1;

  $section.find("a[href]").each((_, el) => {
    const $el = $(el);
    const url = $el.attr("href") ?? "";
    const title = cleanText($el.text());

    if (url.startsWith("http") && title && title.length > 1 && !url.includes("search.naver.com")) {
      results.push({ rank: rank++, title, url, domain: extractDomain(url) });
    }
  });

  return results;
}

function findDominantChannel(sections: SerpSection[]): SerpSectionType | null {
  if (sections.length === 0) return null;

  const counts: Partial<Record<SerpSectionType, number>> = {};
  for (const section of sections) {
    counts[section.type] = (counts[section.type] ?? 0) + section.results.length;
  }

  let max = 0;
  let dominant: SerpSectionType | null = null;
  for (const [type, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      dominant = type as SerpSectionType;
    }
  }

  return dominant;
}
