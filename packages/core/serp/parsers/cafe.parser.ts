import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpResult } from "../serp.types";
import { type SectionParser, extractDomain, cleanText } from "./base.parser";

export const cafeParser: SectionParser = {
  type: "cafe",

  matches($section, $) {
    const heading = $section.find(".api_title, .tit_area").text();
    const dataSource = $section.attr("data-tab") ?? $section.attr("class") ?? "";
    return (
      heading.includes("카페") ||
      dataSource.includes("cafe") ||
      $section.find("a[href*='cafe.naver.com']").length > 0
    );
  },

  parse($section, $) {
    const results: SerpResult[] = [];
    let rank = 1;

    $section.find("li, .bx, .detail_box, .total_area").each((_, el) => {
      const $el = $(el);
      const $link = $el.find("a").first();
      const url = $link.attr("href") ?? "";
      const title = cleanText($link.text());

      if (url && title && url.includes("cafe")) {
        results.push({
          rank: rank++,
          title,
          url,
          domain: extractDomain(url),
          snippet: cleanText($el.find(".dsc_area, .api_txt_lines.dsc_txt").text()).slice(0, 200),
        });
      }
    });

    return results;
  },
};
