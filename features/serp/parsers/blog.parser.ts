import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { SerpResult } from "../serp.types";
import { type SectionParser, extractDomain, cleanText } from "./base.parser";

export const blogParser: SectionParser = {
  type: "blog",

  matches($section, $) {
    const heading = $section.find(".api_title, .tit_area").text();
    const dataSource = $section.attr("data-tab") ?? $section.attr("class") ?? "";
    return (
      heading.includes("블로그") ||
      dataSource.includes("blog") ||
      $section.find("a[href*='blog.naver.com']").length > 0
    );
  },

  parse($section, $) {
    const results: SerpResult[] = [];
    let rank = 1;

    $section.find(".detail_box, .total_area, .api_txt_lines").each((_, el) => {
      const $el = $(el);
      const $link = $el.find("a.api_txt_lines, a[href*='blog']").first();
      const url = $link.attr("href") ?? "";
      const title = cleanText($link.text() || $el.find(".api_txt_lines").first().text());

      if (url && title) {
        results.push({
          rank: rank++,
          title,
          url,
          domain: extractDomain(url),
          snippet: cleanText($el.find(".api_txt_lines.dsc_txt, .dsc_area").text()).slice(0, 200),
        });
      }
    });

    // 대체 셀렉터: 리스트형 블로그 결과
    if (results.length === 0) {
      $section.find("li, .bx").each((_, el) => {
        const $el = $(el);
        const $link = $el.find("a").first();
        const url = $link.attr("href") ?? "";
        const title = cleanText($link.text());

        if (url && title && (url.includes("blog") || url.includes("post"))) {
          results.push({
            rank: rank++,
            title,
            url,
            domain: extractDomain(url),
          });
        }
      });
    }

    return results;
  },
};
