"use client";

import { useState } from "react";
import type { RelatedKeyword } from "@/features/keyword/keyword.types";
import KeywordSearch from "./_components/KeywordSearch";
import KeywordResult from "./_components/KeywordResult";
import OpportunityChart from "./_components/OpportunityChart";

interface ApiResponse {
  seed: string;
  count: number;
  keywords: RelatedKeyword[];
}

export default function KeywordsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSearch = async (seed: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/keywords?q=${encodeURIComponent(seed)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "API 호출 실패");
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
        <h2 className="text-2xl font-bold tracking-tight">키워드 리서치</h2>
        <p className="text-muted-foreground mt-1">
          시드 키워드를 입력하면 연관 키워드와 기회 분석을 제공합니다.
        </p>
      </div>

      <KeywordSearch onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          네이버 검색광고 API 조회 중...
        </div>
      )}

      {result && !isLoading && (
        <>
          <OpportunityChart keywords={result.keywords} />
          <KeywordResult seed={result.seed} keywords={result.keywords} />
        </>
      )}
    </div>
  );
}
