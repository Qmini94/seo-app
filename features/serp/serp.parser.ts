import * as cheerio from "cheerio";
import type { SerpAnalysis, SerpSection, SerpSectionType } from "./serp.types";
import { parsers } from "./parsers";
import { extractAiBriefingData } from "./parsers/ai-briefing.parser";

/**
 * SERP HTML을 파싱하여 영역별 구조를 분석한다.
 *
 * 네이버 통합검색 #main_pack 안의 section 단위로 순회하며,
 * 등록된 파서에 매칭 시도 → 결과 수집.
 */
export function parseSerpHtml(keyword: string, html: string): SerpAnalysis {
  const $ = cheerio.load(html);
  const sections: SerpSection[] = [];
  let position = 1;

  // #main_pack 내 섹션 순회
  $("#main_pack > section, #main_pack > div > section, #main_pack .sc_new").each((_, el) => {
    const $section = $(el);

    for (const parser of parsers) {
      if (parser.matches($section, $)) {
        const results = parser.parse($section, $);
        if (results.length > 0) {
          sections.push({
            type: parser.type,
            position: position++,
            results,
          });
        }
        break; // 첫 매칭 파서만 사용
      }
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
