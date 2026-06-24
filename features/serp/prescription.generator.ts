import type {
  SerpAnalysis,
  ContentStructure,
  ContentPrescription,
  ContentType,
  AiCitedComparison,
} from "./serp.types";
import { SECTION_LABEL } from "./serp.types";
import { aggregateBenchmarks } from "./content.analyzer";

/**
 * SERP 분석 + 상위 콘텐츠 구조를 기반으로 콘텐츠 처방전을 생성한다.
 *
 * 처방전 = "이 키워드로 1페이지에 올라가려면 이렇게 써라"
 * + "AI 브리핑에 인용되려면 이런 구조로 써라"
 */
export function generatePrescription(
  serpAnalysis: SerpAnalysis,
  contentStructures: ContentStructure[]
): ContentPrescription {
  const benchmark = aggregateBenchmarks(contentStructures);
  const channelDist = buildChannelDistribution(serpAnalysis);
  const recommendedChannel = pickRecommendedChannel(channelDist);

  const spec = benchmark
    ? buildSpecFromBenchmark(benchmark)
    : getDefaultSpec();

  // AI 인용 vs 비인용 콘텐츠 비교
  const aiCitedBenchmark = buildAiCitedComparison(contentStructures);

  return {
    keyword: serpAnalysis.keyword,
    recommendedChannel,
    aiBriefing: {
      active: serpAnalysis.aiBriefing.exists,
      citedCount: serpAnalysis.aiBriefing.citedUrls.length,
      hasWebGen: serpAnalysis.aiBriefing.hasWebGen,
      sources: serpAnalysis.aiBriefing.sources,
    },
    spec,
    aiCitedBenchmark,
    channelDistribution: channelDist,
    benchmarkCount: contentStructures.length,
  };
}

/**
 * AI 인용 콘텐츠 vs 일반 상위 콘텐츠 비교 분석
 * AI가 어떤 구조의 콘텐츠를 선호하는지 패턴을 추출한다.
 */
function buildAiCitedComparison(structures: ContentStructure[]): AiCitedComparison | null {
  const cited = structures.filter((s) => s.aiCited);
  const nonCited = structures.filter((s) => !s.aiCited);

  if (cited.length === 0) return null;

  const avgMetrics = (list: ContentStructure[]) => {
    if (list.length === 0) {
      return {
        avgTextLength: 0,
        avgKeywordDensity: 0,
        avgH2Count: 0,
        avgImageCount: 0,
        dominantType: "general" as ContentType,
      };
    }
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const typeCounts: Partial<Record<ContentType, number>> = {};
    for (const s of list) {
      typeCounts[s.contentType] = (typeCounts[s.contentType] ?? 0) + 1;
    }
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ContentType ?? "general";

    return {
      avgTextLength: avg(list.map((s) => s.textLength)),
      avgKeywordDensity: Math.round(list.reduce((a, s) => a + s.keywordDensity, 0) / list.length * 100) / 100,
      avgH2Count: avg(list.map((s) => s.h2Count)),
      avgImageCount: avg(list.map((s) => s.imageCount)),
      dominantType,
    };
  };

  const citedMetrics = avgMetrics(cited);
  const nonCitedMetrics = avgMetrics(nonCited);

  // AI 선호 패턴 도출
  const patterns: string[] = [];

  if (citedMetrics.avgTextLength > nonCitedMetrics.avgTextLength * 1.2) {
    patterns.push("AI 인용 콘텐츠가 일반보다 본문이 길다 → 충분한 분량 작성 권장");
  }
  if (citedMetrics.avgH2Count > nonCitedMetrics.avgH2Count) {
    patterns.push("AI 인용 콘텐츠가 소제목이 더 많다 → 체계적 구조화 권장");
  }
  if (citedMetrics.dominantType === "faq") {
    patterns.push("AI 인용 콘텐츠에 FAQ 구조가 많다 → Q&A 섹션 추가 권장");
  }
  if (citedMetrics.dominantType === "table") {
    patterns.push("AI 인용 콘텐츠에 표 구조가 많다 → 비교표/조건표 삽입 권장");
  }
  if (citedMetrics.dominantType === "list") {
    patterns.push("AI 인용 콘텐츠에 리스트 구조가 많다 → 항목별 정리 권장");
  }
  if (cited.some((s) => s.domain.includes(".go.kr") || s.domain.includes(".or.kr"))) {
    patterns.push("공공기관/공신력 있는 도메인이 인용됨 → 공식 출처 데이터 인용 권장");
  }
  if (patterns.length === 0) {
    patterns.push("AI 인용 패턴 분석에 충분한 데이터가 부족함 — 추가 키워드 분석 권장");
  }

  return {
    citedCount: cited.length,
    nonCitedCount: nonCited.length,
    cited: citedMetrics,
    nonCited: nonCitedMetrics,
    patterns,
  };
}

/** 채널별 결과 수 집계 */
function buildChannelDistribution(serp: SerpAnalysis): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const section of serp.sections) {
    const label = SECTION_LABEL[section.type] ?? section.type;
    dist[label] = (dist[label] ?? 0) + section.results.length;
  }
  return dist;
}

/** 가장 결과가 많은 채널을 추천 */
function pickRecommendedChannel(dist: Record<string, number>): string {
  const contentChannels = ["블로그", "웹사이트", "카페"];
  let best = "블로그"; // 기본
  let max = 0;

  for (const ch of contentChannels) {
    if ((dist[ch] ?? 0) > max) {
      max = dist[ch];
      best = ch;
    }
  }

  return best;
}

/** 벤치마크 기반 스펙 생성 */
function buildSpecFromBenchmark(bm: NonNullable<ReturnType<typeof aggregateBenchmarks>>) {
  return {
    titleLength: {
      min: Math.max(15, bm.titleLength.avg - 10),
      max: bm.titleLength.avg + 10,
      avg: bm.titleLength.avg,
    },
    bodyLength: {
      min: Math.round(bm.textLength.avg * 0.8),
      avg: bm.textLength.avg,
    },
    keywordUsage: {
      min: Math.max(1, bm.keywordCount.avg - 2),
      max: bm.keywordCount.avg + 3,
      density: {
        min: Math.max(0.5, bm.keywordDensity.avg - 0.5),
        max: Math.min(5, bm.keywordDensity.avg + 1),
      },
    },
    h2Count: {
      min: Math.max(2, bm.h2Count.avg - 1),
      max: bm.h2Count.avg + 2,
    },
    imageCount: {
      min: Math.max(1, bm.imageCount.avg - 2),
      avg: bm.imageCount.avg,
    },
    contentType: bm.dominantType,
  };
}

/** 벤치마크 없을 때 업계 기본값 */
function getDefaultSpec() {
  return {
    titleLength: { min: 25, max: 40, avg: 32 },
    bodyLength: { min: 1500, avg: 2500 },
    keywordUsage: {
      min: 3,
      max: 7,
      density: { min: 1.0, max: 2.5 },
    },
    h2Count: { min: 3, max: 6 },
    imageCount: { min: 3, avg: 5 },
    contentType: "general" as ContentType,
  };
}
