"use client";

import type { IsrPrescription, IsrStrategy } from "@/features/serp/serp.types";
import { Badge } from "@/components/ui/badge";

interface Props {
  prescription: IsrPrescription;
}

const DIFFICULTY_CONFIG = {
  easy: { label: "진입 용이", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  moderate: { label: "보통", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  hard: { label: "경쟁 치열", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const PRIORITY_STYLE = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-400",
};

const CATEGORY_LABEL: Record<IsrStrategy["category"], string> = {
  structure: "구조",
  content: "콘텐츠",
  authority: "권위",
  format: "포맷",
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  list: "리스트형",
  table: "비교표형",
  faq: "FAQ형",
  step: "단계별 가이드형",
  general: "일반형",
};

export default function IsrPrescriptionCard({ prescription: p }: Props) {
  const diff = DIFFICULTY_CONFIG[p.difficulty];

  return (
    <div className="rounded-lg border bg-background p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">ISR 처방전</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            &quot;{p.keyword}&quot; AI 브리핑 인용 최적화 가이드
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${diff.color}`}>
            {diff.label}
          </span>
          {p.aiBriefingActive ? (
            <Badge variant="secondary">AI 브리핑 활성</Badge>
          ) : (
            <Badge variant="outline">AI 브리핑 미활성</Badge>
          )}
        </div>
      </div>

      {/* 콘텐츠 스펙 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">권장 콘텐츠 스펙</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <SpecCard
            label="본문 길이"
            value={`${p.contentSpec.bodyLength.recommended.toLocaleString()}자`}
            sub={`최소 ${p.contentSpec.bodyLength.min.toLocaleString()}자`}
          />
          <SpecCard
            label="소제목 (H2)"
            value={`${p.contentSpec.h2Count.recommended}개`}
            sub={`최소 ${p.contentSpec.h2Count.min}개`}
          />
          <SpecCard
            label="이미지"
            value={`${p.contentSpec.imageCount.recommended}장`}
            sub={`최소 ${p.contentSpec.imageCount.min}장`}
          />
          <SpecCard
            label="키워드 밀도"
            value={`${p.contentSpec.keywordDensity.min}~${p.contentSpec.keywordDensity.max}%`}
            sub="자연스러운 반복"
          />
          <SpecCard
            label="콘텐츠 형태"
            value={CONTENT_TYPE_LABEL[p.contentSpec.contentType] ?? p.contentSpec.contentType}
            sub="AI 인용 콘텐츠 기준"
          />
        </div>
      </div>

      {/* 전략 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">ISR 전략</h4>
        <div className="space-y-2">
          {p.strategies.map((s, i) => (
            <div
              key={i}
              className={`border-l-4 ${PRIORITY_STYLE[s.priority]} rounded-r-md border border-l-4 p-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {CATEGORY_LABEL[s.category]}
                </Badge>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI 인사이트 */}
      {p.aiInsights && (
        <div className="rounded-md border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            AI 패턴 분석 인사이트
          </h4>

          {p.aiInsights.commonTraits.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">공통 특징</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {p.aiInsights.commonTraits.map((t, i) => (
                  <li key={i}>- {t}</li>
                ))}
              </ul>
            </div>
          )}

          {p.aiInsights.commonExpressions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">AI 인용 핵심 표현</p>
              <div className="flex flex-wrap gap-1">
                {p.aiInsights.commonExpressions.map((e, i) => (
                  <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI 선호 포맷: <span className="font-medium">{p.aiInsights.preferredFormat}</span>
          </p>
        </div>
      )}

      {/* 체크리스트 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">작성 체크리스트</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {p.checklist.map((item, i) => (
            <label key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="mt-0.5 shrink-0" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
