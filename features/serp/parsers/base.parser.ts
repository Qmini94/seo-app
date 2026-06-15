import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpResult, SerpSectionType } from "../serp.types";

/**
 * SERP 영역 파서 기본 인터페이스.
 * 각 영역(블로그, 카페, 웹 등)은 이 인터페이스를 구현한다.
 */
export interface SectionParser {
  type: SerpSectionType;
  /** 이 섹션에 해당하는지 판별 */
  matches($section: Cheerio<AnyNode>, $: CheerioAPI): boolean;
  /** 섹션 내 개별 결과 파싱 */
  parse($section: Cheerio<AnyNode>, $: CheerioAPI): SerpResult[];
}

/** URL에서 도메인 추출 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/** 텍스트 정리 (줄바꿈, 여러 공백 → 단일 공백) */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
