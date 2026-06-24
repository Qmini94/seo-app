"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SerpAnalysis, ContentStructure, ContentPrescription, IsrPrescription } from "@/features/serp/serp.types";
import type { AiPatternAnalysis } from "@/features/serp/ai-pattern.analyzer";
import SerpOverview from "./_components/SerpOverview";
import PrescriptionCard from "./_components/PrescriptionCard";
import ContentBenchmark from "./_components/ContentBenchmark";
import IsrPrescriptionCard from "./_components/IsrPrescriptionCard";

interface ApiResponse {
  serpAnalysis: SerpAnalysis;
  contentStructures: ContentStructure[];
  prescription: ContentPrescription;
  isrPrescription: IsrPrescription;
  aiPatternAnalysis: AiPatternAnalysis | null;
}

export default function SerpPage() {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/serp?keyword=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "SERP 분석 실패");
      }

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SERP 분석 + ISR 처방전</h2>
        <p className="text-muted-foreground mt-1">
          키워드의 검색결과 구조를 분석하고 AI 브리핑 인용 최적화 가이드를 생성합니다.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="flex gap-2 max-w-lg">
        <Input
          placeholder="분석할 키워드 입력 (예: 피부과 여드름 치료)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !keyword.trim()}>
          {isLoading ? "분석 중..." : "분석"}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>SERP 크롤링 + 콘텐츠 분석 중...</p>
          <p className="text-xs">상위 콘텐츠를 개별 크롤링하므로 30초~1분 소요될 수 있습니다.</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6">
          <IsrPrescriptionCard prescription={result.isrPrescription} />
          <PrescriptionCard prescription={result.prescription} />
          <SerpOverview serpAnalysis={result.serpAnalysis} />
          <ContentBenchmark
            structures={result.contentStructures}
            keyword={result.serpAnalysis.keyword}
          />
        </div>
      )}
    </div>
  );
}
