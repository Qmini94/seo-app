import type {
  SerpAnalysis,
  ContentStructure,
  ContentPrescription,
  ContentType,
  SerpSectionType,
} from "./serp.types";
import { SECTION_LABEL } from "./serp.types";
import { aggregateBenchmarks } from "./content.analyzer";

/**
 * SERP 분석 + 상위 콘텐츠 구조를 기반으로 콘텐츠 처방전을 생성한다.
 *
 * 처방전 = "이 키워드로 1페이지에 올라가려면 이렇게 써라"
 * - 추천 채널 (블로그/웹/카페)
 * - 제목/본문/키워드/소제목/이미지 수치 가이드
 * - AI 브리핑 최적화 권장사항
 */
export function generatePrescription(
  serpAnalysis: SerpAnalysis,
  contentStructures: ContentStructure[]
): ContentPrescription {
  const benchmark = aggregateBenchmarks(contentStructures);
  const channelDist = buildChannelDistribution(serpAnalysis);
  const recommendedChannel = pickRecommendedChannel(channelDist);

  // 벤치마크 데이터가 없으면 업계 기본값 사용
  const spec = benchmark
    ? buildSpecFromBenchmark(benchmark)
    : getDefaultSpec();

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
    channelDistribution: channelDist,
    benchmarkCount: contentStructures.length,
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
