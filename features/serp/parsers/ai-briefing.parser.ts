import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpResult } from "../serp.types";
import type { AiBriefingData } from "../serp.types";
import { type SectionParser, extractDomain, cleanText } from "./base.parser";

/**
 * AI 브리핑 파서 — 화이트스페이스 핵심 영역.
 *
 * 네이버 AI 브리핑은 통합검색 상단에 노출되며,
 * 인용 소스 URL을 포함한다. 이 인용 패턴을 분석하여
 * "어떻게 하면 AI 브리핑에 인용될 수 있는지" 처방에 반영한다.
 */
export const aiBriefingParser: SectionParser = {
  type: "ai_briefing",

  matches($section, $) {
    const heading = $section.find(".api_title, .tit_area").text();
    const dataSource = $section.attr("data-tab") ?? $section.attr("class") ?? "";
    const html = $section.html() ?? "";
    return (
      heading.includes("AI") ||
      heading.includes("브리핑") ||
      dataSource.includes("ai") ||
      dataSource.includes("brief") ||
      html.includes("ai_briefing") ||
      html.includes("ai-briefing") ||
      html.includes("_ai_")
    );
  },

  parse($section, $) {
    const results: SerpResult[] = [];
    let rank = 1;

    // AI 브리핑 인용 소스 링크 수집
    $section.find("a[href]").each((_, el) => {
      const $el = $(el);
      const url = $el.attr("href") ?? "";
      const title = cleanText($el.text());

      if (url.startsWith("http") && title && !url.includes("search.naver.com")) {
        results.push({
          rank: rank++,
          title,
          url,
          domain: extractDomain(url),
        });
      }
    });

    return results;
  },
};

/**
 * AI 브리핑 존재 여부 + 인용 URL을 별도로 추출하는 헬퍼.
 * SerpSection과 별도로 AiBriefingData를 생성할 때 사용.
 */
export function extractAiBriefingData($: CheerioAPI): AiBriefingData {
  const $body = $("body");
  const html = $body.html() ?? "";
  const exists =
    html.includes("ai_briefing") ||
    html.includes("ai-briefing") ||
    html.includes("_ai_") ||
    $body.find("[class*='ai_briefing'], [class*='ai-briefing']").length > 0;

  const citedUrls: string[] = [];

  if (exists) {
    $body.find("[class*='ai_briefing'] a[href], [class*='ai-briefing'] a[href]").each((_, el) => {
      const url = $(el).attr("href") ?? "";
      if (url.startsWith("http") && !url.includes("search.naver.com")) {
        citedUrls.push(url);
      }
    });
  }

  return { exists, citedUrls: [...new Set(citedUrls)] };
}
