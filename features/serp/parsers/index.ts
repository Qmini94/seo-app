import type { SectionParser } from "./base.parser";
import { blogParser } from "./blog.parser";
import { cafeParser } from "./cafe.parser";
import { webParser } from "./web.parser";
import { newsParser } from "./news.parser";
import { aiBriefingParser } from "./ai-briefing.parser";

/**
 * 파서 레지스트리 — 우선순위 순서대로 매칭 시도.
 * AI 브리핑을 먼저 체크하여 다른 파서에 잘못 잡히지 않게 한다.
 */
export const parsers: SectionParser[] = [
  aiBriefingParser,
  blogParser,
  cafeParser,
  newsParser,
  webParser,
];
