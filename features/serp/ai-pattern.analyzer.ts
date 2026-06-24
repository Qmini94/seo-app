import { askClaudeJson } from "@/infrastructure/ai/claude.client";
import { crawlContentPage } from "@/infrastructure/crawler/serp.crawler";
import { extractBodyText } from "./content.analyzer";
import * as cheerio from "cheerio";
import type { AiBriefingData, ContentStructure } from "./serp.types";

/** AI 패턴 분석 결과 */
export interface AiPatternAnalysis {
  /** AI가 인용한 콘텐츠의 공통 특징 */
  commonTraits: string[];
  /** AI 인용에 유리한 콘텐츠 구조 권장사항 */
  recommendations: string[];
  /** AI가 선호하는 콘텐츠 형태 */
  preferredFormat: "정의형" | "비교표" | "FAQ" | "리스트" | "가이드" | "혼합";
  /** AI가 인용한 콘텐츠에서 발견된 공통 키워드/표현 */
  commonExpressions: string[];
  /** 신뢰도 (분석에 사용된 콘텐츠 수 기반) */
  confidence: "high" | "medium" | "low";
}

const SYSTEM_PROMPT = `당신은 네이버 검색 AI 브리핑 최적화 전문가입니다.
네이버 AI 브리핑은 검색 결과에서 특정 콘텐츠를 인용하여 요약합니다.
주어진 데이터를 분석하여 AI가 어떤 콘텐츠를 인용하는지 패턴을 찾아주세요.

반드시 아래 JSON 형식으로만 응답하세요:
\`\`\`json
{
  "commonTraits": ["특징1", "특징2", ...],
  "recommendations": ["권장사항1", "권장사항2", ...],
  "preferredFormat": "정의형|비교표|FAQ|리스트|가이드|혼합",
  "commonExpressions": ["표현1", "표현2", ...],
  "confidence": "high|medium|low"
}
\`\`\``;

/**
 * AI 브리핑 인용 콘텐츠의 패턴을 Claude로 분석한다.
 *
 * 1) AI 인용 URL의 본문 텍스트를 추출 (이미 크롤링된 것 재사용)
 * 2) 인용/비인용 콘텐츠의 구조 데이터를 비교
 * 3) Claude에게 패턴 분석 요청
 */
export async function analyzeAiCitationPattern(
  keyword: string,
  aiBriefing: AiBriefingData,
  contentStructures: ContentStructure[]
): Promise<AiPatternAnalysis | null> {
  if (!aiBriefing.exists || aiBriefing.citedUrls.length === 0) {
    return null;
  }

  // AI 인용 콘텐츠의 본문 텍스트 수집 (최대 3개, 각 1500자)
  const citedTexts = await collectCitedTexts(aiBriefing.citedUrls, 3);

  const cited = contentStructures.filter((s) => s.aiCited);
  const nonCited = contentStructures.filter((s) => !s.aiCited);

  // Claude에게 보낼 분석 데이터 구성
  const userMessage = buildAnalysisPrompt(keyword, aiBriefing, cited, nonCited, citedTexts);

  const confidence: AiPatternAnalysis["confidence"] =
    cited.length >= 3 ? "high" :
    cited.length >= 1 ? "medium" : "low";

  try {
    const result = await askClaudeJson<AiPatternAnalysis>(
      SYSTEM_PROMPT,
      userMessage,
      { maxTokens: 1500, temperature: 0.3 }
    );
    // confidence는 데이터 수 기반으로 덮어씀
    result.confidence = confidence;
    return result;
  } catch {
    return null;
  }
}

/** AI 인용 URL의 본문 텍스트 수집 */
async function collectCitedTexts(urls: string[], maxCount: number): Promise<{ url: string; text: string }[]> {
  const results: { url: string; text: string }[] = [];

  for (const url of urls.slice(0, maxCount)) {
    try {
      const html = await crawlContentPage(url);
      const $ = cheerio.load(html);
      $("script, style, nav, header, footer, .comment, #comment").remove();
      const text = extractBodyText($);
      if (text.length > 100) {
        // 토큰 절약: 1500자로 제한
        results.push({ url, text: text.slice(0, 1500) });
      }
    } catch {
      // 크롤링 실패는 무시
    }
    // 딜레이
    await new Promise((r) => setTimeout(r, 2000));
  }

  return results;
}

/** Claude에 보낼 분석 프롬프트 구성 */
function buildAnalysisPrompt(
  keyword: string,
  aiBriefing: AiBriefingData,
  cited: ContentStructure[],
  nonCited: ContentStructure[],
  citedTexts: { url: string; text: string }[]
): string {
  const parts: string[] = [];

  parts.push(`# 분석 대상 키워드: "${keyword}"`);
  parts.push("");

  // AI 브리핑 정보
  parts.push("## AI 브리핑 인용 소스");
  for (const src of aiBriefing.sources) {
    parts.push(`- ${src.domain}: ${src.aiDescription.slice(0, 200)}`);
  }
  parts.push("");

  // 인용 콘텐츠 구조
  if (cited.length > 0) {
    parts.push("## AI 인용 콘텐츠 구조");
    for (const s of cited) {
      parts.push(`- ${s.domain} | 본문 ${s.textLength}자 | H2 ${s.h2Count}개 | 이미지 ${s.imageCount}개 | 형태: ${s.contentType} | 키워드밀도 ${s.keywordDensity}%`);
    }
    parts.push("");
  }

  // 비인용 콘텐츠 구조
  if (nonCited.length > 0) {
    parts.push("## 일반 상위 콘텐츠 구조 (AI 미인용)");
    for (const s of nonCited) {
      parts.push(`- ${s.domain} | 본문 ${s.textLength}자 | H2 ${s.h2Count}개 | 이미지 ${s.imageCount}개 | 형태: ${s.contentType} | 키워드밀도 ${s.keywordDensity}%`);
    }
    parts.push("");
  }

  // 인용 콘텐츠 본문 발췌
  if (citedTexts.length > 0) {
    parts.push("## AI 인용 콘텐츠 본문 발췌");
    for (const t of citedTexts) {
      parts.push(`### ${t.url}`);
      parts.push(t.text);
      parts.push("");
    }
  }

  parts.push("위 데이터를 분석하여 네이버 AI 브리핑이 이 콘텐츠들을 인용한 이유와 패턴을 JSON으로 응답하세요.");

  return parts.join("\n");
}
