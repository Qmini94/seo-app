import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpResult, AiBriefingData, AiBriefingSource } from "../serp.types";
import { type SectionParser, extractDomain, cleanText } from "./base.parser";

/**
 * AI 브리핑 파서 — 네이버 검색 결과 내 AI 출처 정보 영역.
 *
 * 실제 구조 (2026-06 기준):
 * - AI 브리핑은 별도 섹션이 아니라 웹 결과 카드 내부에 인라인 포함됨
 * - `.api_ly_save` 영역 텍스트에 "AI 출처 정보" 포함 여부로 식별
 * - `data-meta-area="web_gen"` 이 AI 생성 검색결과 영역
 * - 개별 카드마다 AI가 생성한 사이트 설명이 붙어있음
 *
 * 이 파서는 섹션 단위 매칭 대신, extractAiBriefingData()로 전체 HTML에서 추출.
 * SectionParser 인터페이스는 하위 호환용으로 유지.
 */
export const aiBriefingParser: SectionParser = {
  type: "ai_briefing",

  matches($section, $) {
    // data-meta-area="web_gen" 이면 AI 생성 영역
    const area = $section.attr("data-meta-area") ?? "";
    if (area === "web_gen") return true;

    // 섹션 내 "AI 출처 정보" 텍스트 존재 여부
    const text = $section.text();
    return text.includes("AI 출처 정보") || text.includes("AI를 활용해 제공하는");
  },

  parse($section, $) {
    const results: SerpResult[] = [];
    let rank = 1;

    $section.find("a[href]").each((_, el) => {
      const $el = $(el);
      const url = $el.attr("href") ?? "";
      const title = cleanText($el.text());

      if (url.startsWith("http") && title && !url.includes("search.naver.com") && !url.includes("keep.naver.com") && !url.includes("help.naver.com")) {
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
 * AI 브리핑 데이터를 전체 HTML에서 추출한다.
 *
 * 탐지 전략:
 * 1. `.api_ly_save` 영역 중 "AI 출처 정보" 텍스트를 포함하는 것 찾기
 * 2. `data-meta-area="web_gen"` 영역 존재 여부 확인
 * 3. 인용 소스의 URL, 도메인, AI 설명 텍스트 추출
 */
export function extractAiBriefingData($: CheerioAPI): AiBriefingData {
  const sources: AiBriefingSource[] = [];
  const citedUrls: string[] = [];
  let exists = false;

  // 1) .api_ly_save 영역에서 "AI 출처 정보" 찾기
  $(".api_ly_save, ._keep_save_layer").each((_, el) => {
    const $layer = $(el);
    const layerText = $layer.text();

    if (layerText.includes("AI 출처 정보")) {
      exists = true;

      // 부모 섹션(sc_new)에서 출처 URL과 제목 추출
      const $section = $layer.closest(".sc_new[data-fender-root]");
      if ($section.length > 0) {
        // 메인 링크 (사이트 URL)
        $section.find("a[href]").each((_, a) => {
          const url = $(a).attr("href") ?? "";
          const text = cleanText($(a).text());
          if (
            url.startsWith("http") &&
            text &&
            !url.includes("search.naver.com") &&
            !url.includes("keep.naver.com") &&
            !url.includes("help.naver.com") &&
            !citedUrls.includes(url)
          ) {
            citedUrls.push(url);
          }
        });

        // AI 설명 텍스트 추출 ("AI 출처 정보" 이후, "네이버가 AI를 활용해" 이전)
        const aiDescMatch = layerText.match(
          /AI 출처 정보([\s\S]+?)(?:네이버가 AI를 활용해|$)/
        );
        const aiDescription = aiDescMatch ? cleanText(aiDescMatch[1]) : "";

        // 첫 번째 링크를 대표 출처로
        const firstLink = $section.find("a[href^='http']").first();
        const firstUrl = firstLink.attr("href") ?? "";
        if (firstUrl && !firstUrl.includes("search.naver.com")) {
          sources.push({
            url: firstUrl,
            domain: extractDomain(firstUrl),
            title: cleanText(firstLink.text()),
            aiDescription,
          });
        }
      }
    }
  });

  // 2) data-meta-area="web_gen" 영역 확인
  const hasWebGen = $('[data-meta-area="web_gen"]').length > 0;
  if (hasWebGen) {
    exists = true;

    // web_gen 영역의 링크도 인용 URL로 수집
    $('[data-meta-area="web_gen"] a[href]').each((_, el) => {
      const url = $(el).attr("href") ?? "";
      if (
        url.startsWith("http") &&
        !url.includes("search.naver.com") &&
        !url.includes("keep.naver.com") &&
        !citedUrls.includes(url)
      ) {
        citedUrls.push(url);
      }
    });
  }

  return {
    exists,
    citedUrls: [...new Set(citedUrls)],
    sources,
    hasWebGen,
  };
}
