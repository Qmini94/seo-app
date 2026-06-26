"use client";

import type { ContentPrescription } from "@core/serp/serp.types";
import { Badge } from "@ui/badge";

interface Props {
  prescription: ContentPrescription;
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  list: "리스트형",
  table: "비교표형",
  faq: "FAQ형",
  step: "스텝바이스텝형",
  general: "일반형",
};

export default function PrescriptionCard({ prescription: p }: Props) {
  return (
    <div className="rounded-lg border bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">콘텐츠 처방전</h3>
        <div className="flex items-center gap-2">
          <Badge variant="default">{p.recommendedChannel}</Badge>
          {p.aiBriefing.active && (
            <Badge variant="secondary">AI 브리핑 활성</Badge>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        키워드 &quot;{p.keyword}&quot; — 상위 {p.benchmarkCount}개 콘텐츠 벤치마크 기반
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SpecItem
          label="제목"
          value={`${p.spec.titleLength.min}~${p.spec.titleLength.max}자`}
          detail={`상위 평균 ${p.spec.titleLength.avg}자, 키워드 앞쪽 배치`}
        />
        <SpecItem
          label="본문 길이"
          value={`${p.spec.bodyLength.min.toLocaleString()}자 이상`}
          detail={`상위 평균 ${p.spec.bodyLength.avg.toLocaleString()}자`}
        />
        <SpecItem
          label="키워드 사용"
          value={`본문 내 ${p.spec.keywordUsage.min}~${p.spec.keywordUsage.max}회`}
          detail={`밀도 ${p.spec.keywordUsage.density.min}~${p.spec.keywordUsage.density.max}%`}
        />
        <SpecItem
          label="소제목 (H2)"
          value={`${p.spec.h2Count.min}~${p.spec.h2Count.max}개`}
          detail="핵심 주제별 소제목 분리"
        />
        <SpecItem
          label="이미지"
          value={`${p.spec.imageCount.min}장 이상`}
          detail={`상위 평균 ${p.spec.imageCount.avg}장`}
        />
        <SpecItem
          label="콘텐츠 형태"
          value={CONTENT_TYPE_LABEL[p.spec.contentType] ?? p.spec.contentType}
          detail="상위 콘텐츠에서 가장 많이 사용된 형태"
        />
      </div>

      {p.aiBriefing.active && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4 text-sm space-y-1">
          <p className="font-semibold text-blue-700 dark:text-blue-300">AI 브리핑 최적화</p>
          <p>인용 소스 {p.aiBriefing.citedCount}개 감지</p>
          <p>권장: FAQ 섹션 추가, 정의형 문장 사용, 비교표 삽입으로 인용 확률 상승</p>
        </div>
      )}

      {Object.keys(p.channelDistribution).length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">채널 분포</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(p.channelDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([channel, count]) => (
                <Badge key={channel} variant="outline">
                  {channel} {count}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{detail}</p>
    </div>
  );
}
