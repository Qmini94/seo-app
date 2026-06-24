import type {
  SerpAnalysis,
  ContentStructure,
  ContentPrescription,
  IsrPrescription,
  IsrStrategy,
  ContentType,
} from "./serp.types";
import type { AiPatternAnalysis } from "./ai-pattern.analyzer";

/**
 * ISR 처방전 생성 — AI 브리핑에 인용되기 위한 콘텐츠 최적화 가이드
 *
 * 입력:
 * - serpAnalysis: SERP 구조 분석
 * - contentStructures: 상위 콘텐츠 구조 분석
 * - prescription: 일반 SEO 처방전 (벤치마크)
 * - aiPatternAnalysis: Claude AI 패턴 분석 (nullable)
 *
 * 출력:
 * - ISR 처방전 (난이도 + 콘텐츠 스펙 + 전략 + 체크리스트)
 */
export function generateIsrPrescription(
  serpAnalysis: SerpAnalysis,
  contentStructures: ContentStructure[],
  prescription: ContentPrescription,
  aiPatternAnalysis: AiPatternAnalysis | null
): IsrPrescription {
  const cited = contentStructures.filter((s) => s.aiCited);
  const nonCited = contentStructures.filter((s) => !s.aiCited);

  const difficulty = assessDifficulty(serpAnalysis, cited);
  const contentSpec = buildContentSpec(cited, nonCited, prescription);
  const strategies = buildStrategies(serpAnalysis, cited, nonCited, aiPatternAnalysis);
  const checklist = buildChecklist(serpAnalysis, contentSpec, aiPatternAnalysis);
  const aiInsights = aiPatternAnalysis
    ? {
        commonTraits: aiPatternAnalysis.commonTraits,
        recommendations: aiPatternAnalysis.recommendations,
        preferredFormat: aiPatternAnalysis.preferredFormat,
        commonExpressions: aiPatternAnalysis.commonExpressions,
      }
    : null;

  return {
    keyword: serpAnalysis.keyword,
    aiBriefingActive: serpAnalysis.aiBriefing.exists,
    difficulty,
    contentSpec,
    strategies,
    checklist,
    aiInsights,
  };
}

/** AI 브리핑 인용 난이도 평가 */
function assessDifficulty(
  serp: SerpAnalysis,
  cited: ContentStructure[]
): IsrPrescription["difficulty"] {
  if (!serp.aiBriefing.exists) return "easy"; // AI 브리핑 자체가 없으면 진입 기회

  const citedCount = serp.aiBriefing.citedUrls.length;
  const hasAuthoritativeSources = cited.some(
    (s) => s.domain.includes(".go.kr") || s.domain.includes(".or.kr") || s.domain.includes(".ac.kr")
  );

  // 공신력 도메인이 인용되고 + 인용 수 3개 이상이면 hard
  if (hasAuthoritativeSources && citedCount >= 3) return "hard";
  if (citedCount >= 3) return "moderate";
  return "easy";
}

/** AI 인용 콘텐츠 기반 콘텐츠 스펙 산출 */
function buildContentSpec(
  cited: ContentStructure[],
  nonCited: ContentStructure[],
  prescription: ContentPrescription
): IsrPrescription["contentSpec"] {
  // AI 인용 콘텐츠가 있으면 해당 벤치마크 우선, 없으면 일반 처방전 기준
  if (cited.length > 0) {
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    const textLengths = cited.map((s) => s.textLength);
    const h2Counts = cited.map((s) => s.h2Count);
    const imageCounts = cited.map((s) => s.imageCount);
    const densities = cited.map((s) => s.keywordDensity);

    const avgText = avg(textLengths);
    const avgH2 = avg(h2Counts);
    const avgImage = avg(imageCounts);
    const avgDensity = densities.reduce((a, b) => a + b, 0) / densities.length;

    // 인용 콘텐츠의 지배적 형태
    const typeCounts: Partial<Record<ContentType, number>> = {};
    for (const s of cited) {
      typeCounts[s.contentType] = (typeCounts[s.contentType] ?? 0) + 1;
    }
    const dominantType =
      (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ContentType) ?? "general";

    return {
      bodyLength: {
        min: Math.round(avgText * 0.8),
        recommended: Math.round(avgText * 1.2), // 인용 평균보다 20% 더
      },
      h2Count: {
        min: Math.max(2, avgH2),
        recommended: avgH2 + 2,
      },
      imageCount: {
        min: Math.max(1, avgImage - 1),
        recommended: avgImage + 2,
      },
      keywordDensity: {
        min: Math.max(0.5, Math.round((avgDensity - 0.5) * 100) / 100),
        max: Math.min(5, Math.round((avgDensity + 1) * 100) / 100),
      },
      contentType: dominantType,
    };
  }

  // 인용 데이터 없으면 일반 처방전 + ISR 보정
  return {
    bodyLength: {
      min: prescription.spec.bodyLength.min,
      recommended: Math.round(prescription.spec.bodyLength.avg * 1.3), // 일반보다 30% 더
    },
    h2Count: {
      min: prescription.spec.h2Count.min,
      recommended: prescription.spec.h2Count.max + 1,
    },
    imageCount: {
      min: prescription.spec.imageCount.min,
      recommended: prescription.spec.imageCount.avg + 2,
    },
    keywordDensity: {
      min: prescription.spec.keywordUsage.density.min,
      max: prescription.spec.keywordUsage.density.max,
    },
    contentType: prescription.spec.contentType,
  };
}

/** ISR 전략 목록 생성 */
function buildStrategies(
  serp: SerpAnalysis,
  cited: ContentStructure[],
  nonCited: ContentStructure[],
  aiPattern: AiPatternAnalysis | null
): IsrStrategy[] {
  const strategies: IsrStrategy[] = [];

  // 1. 구조 전략 — 항상 포함
  strategies.push({
    category: "structure",
    priority: "high",
    title: "명확한 소제목(H2) 구조화",
    description: "AI는 정보를 추출할 때 H2 소제목을 기준으로 섹션을 인식합니다. 핵심 질문을 H2로 배치하세요.",
  });

  // 2. AI 브리핑 존재 여부에 따른 전략
  if (serp.aiBriefing.exists) {
    strategies.push({
      category: "content",
      priority: "high",
      title: "AI 브리핑 인용 소스 분석 대응",
      description: `현재 ${serp.aiBriefing.citedUrls.length}개 소스가 인용 중입니다. 인용된 콘텐츠보다 더 포괄적이고 정확한 정보를 제공하세요.`,
    });
  } else {
    strategies.push({
      category: "content",
      priority: "high",
      title: "AI 브리핑 선점 기회",
      description: "이 키워드에 아직 AI 브리핑이 활성화되지 않았습니다. 정의형/FAQ 구조로 먼저 대응하면 인용 가능성이 높습니다.",
    });
  }

  // 3. 인용 vs 비인용 비교 기반 전략
  if (cited.length > 0 && nonCited.length > 0) {
    const avgCitedText = cited.reduce((a, s) => a + s.textLength, 0) / cited.length;
    const avgNonCitedText = nonCited.reduce((a, s) => a + s.textLength, 0) / nonCited.length;

    if (avgCitedText > avgNonCitedText * 1.2) {
      strategies.push({
        category: "content",
        priority: "high",
        title: "충분한 본문 분량 확보",
        description: `AI 인용 콘텐츠 평균 ${Math.round(avgCitedText).toLocaleString()}자 vs 일반 ${Math.round(avgNonCitedText).toLocaleString()}자. 상세한 설명이 인용에 유리합니다.`,
      });
    }

    const avgCitedH2 = cited.reduce((a, s) => a + s.h2Count, 0) / cited.length;
    const avgNonCitedH2 = nonCited.reduce((a, s) => a + s.h2Count, 0) / nonCited.length;

    if (avgCitedH2 > avgNonCitedH2) {
      strategies.push({
        category: "structure",
        priority: "medium",
        title: "더 많은 소제목으로 구조화",
        description: `AI 인용 콘텐츠는 평균 H2 ${Math.round(avgCitedH2)}개, 일반은 ${Math.round(avgNonCitedH2)}개. 체계적 구조가 인용률을 높입니다.`,
      });
    }
  }

  // 4. 콘텐츠 형태 전략
  if (cited.length > 0) {
    const typeCounts: Partial<Record<ContentType, number>> = {};
    for (const s of cited) {
      typeCounts[s.contentType] = (typeCounts[s.contentType] ?? 0) + 1;
    }
    const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      const typeLabel: Record<ContentType, string> = {
        faq: "FAQ(질문/답변)",
        list: "리스트(항목 나열)",
        table: "비교표",
        step: "단계별 가이드",
        general: "일반형",
      };
      strategies.push({
        category: "format",
        priority: "high",
        title: `${typeLabel[dominant[0] as ContentType]} 형태 권장`,
        description: `AI 인용 콘텐츠 중 ${typeLabel[dominant[0] as ContentType]} 형태가 가장 많습니다. 이 형식으로 작성하면 인용 확률이 높아집니다.`,
      });
    }
  }

  // 5. web_gen 존재 시 전략
  if (serp.aiBriefing.hasWebGen) {
    strategies.push({
      category: "content",
      priority: "medium",
      title: "AI 생성 검색결과(web_gen) 대응",
      description: "네이버가 AI로 직접 생성한 검색결과가 있습니다. 정확한 데이터와 출처를 포함해 AI 생성 답변보다 신뢰도 높은 콘텐츠를 만드세요.",
    });
  }

  // 6. 권위 전략
  strategies.push({
    category: "authority",
    priority: "medium",
    title: "출처와 데이터 명시",
    description: "공식 통계, 논문, 정부 자료 등을 인용하고 출처를 명시하세요. AI는 신뢰도 높은 데이터를 선호합니다.",
  });

  // 7. AI 패턴 분석 기반 전략
  if (aiPattern) {
    if (aiPattern.preferredFormat !== "혼합") {
      const formatMap: Record<string, string> = {
        "정의형": "핵심 개념을 명확히 정의하는 문장으로 시작하세요",
        "비교표": "항목별 비교표를 포함하세요",
        "FAQ": "Q&A 형식의 섹션을 추가하세요",
        "리스트": "핵심 정보를 번호/불릿 리스트로 정리하세요",
        "가이드": "단계별 가이드 형식으로 작성하세요",
      };
      strategies.push({
        category: "format",
        priority: "high",
        title: `AI 선호 포맷: ${aiPattern.preferredFormat}`,
        description: formatMap[aiPattern.preferredFormat] ?? "AI가 선호하는 형식으로 작성하세요.",
      });
    }

    if (aiPattern.commonExpressions.length > 0) {
      strategies.push({
        category: "content",
        priority: "medium",
        title: "AI 인용 핵심 표현 활용",
        description: `다음 표현을 자연스럽게 포함하세요: ${aiPattern.commonExpressions.slice(0, 5).join(", ")}`,
      });
    }
  }

  // priority 정렬: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  strategies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return strategies;
}

/** 콘텐츠 작성 체크리스트 생성 */
function buildChecklist(
  serp: SerpAnalysis,
  spec: IsrPrescription["contentSpec"],
  aiPattern: AiPatternAnalysis | null
): string[] {
  const checks: string[] = [];

  // 필수 항목
  checks.push(`본문 ${spec.bodyLength.recommended.toLocaleString()}자 이상 작성`);
  checks.push(`H2 소제목 ${spec.h2Count.recommended}개 이상 사용`);
  checks.push(`이미지 ${spec.imageCount.recommended}장 이상 포함`);
  checks.push(`키워드 밀도 ${spec.keywordDensity.min}~${spec.keywordDensity.max}% 유지`);

  // 구조 항목
  checks.push("첫 문단에서 키워드의 핵심 정의/답변을 제시");
  checks.push("H2 소제목에 키워드 또는 관련 질문 포함");
  checks.push("각 섹션에 구체적 수치/데이터 포함");

  // 콘텐츠 형태별
  const typeChecks: Record<ContentType, string> = {
    faq: "FAQ 섹션 추가 (최소 3개 Q&A)",
    list: "핵심 정보를 번호/불릿 리스트로 정리",
    table: "비교표 또는 조건표 1개 이상 삽입",
    step: "단계별 가이드 형식으로 구성 (Step 1, 2, 3...)",
    general: "정보를 논리적 흐름으로 구성",
  };
  checks.push(typeChecks[spec.contentType]);

  // AI 브리핑 관련
  if (serp.aiBriefing.exists) {
    checks.push("AI 브리핑이 인용한 소스의 정보를 포괄하는 내용 포함");
    checks.push("기존 인용 소스보다 최신 데이터 사용");
  }

  // AI 패턴 분석 기반
  if (aiPattern?.recommendations) {
    for (const rec of aiPattern.recommendations.slice(0, 3)) {
      checks.push(rec);
    }
  }

  // 공통 마무리
  checks.push("출처/참고자료 명시 (공신력 있는 기관 우선)");
  checks.push("메타 디스크립션에 키워드 + 핵심 답변 요약 포함");

  return checks;
}
