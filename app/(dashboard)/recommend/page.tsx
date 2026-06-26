"use client";

import { useState } from "react";
import ProfileForm from "./_components/ProfileForm";
import RecommendResult from "./_components/RecommendResult";
import type { BusinessProfile, RelatedKeyword } from "@core/keyword";

interface RecommendKeyword extends RelatedKeyword {
  category: string;
}

interface ApiResponse {
  profile: BusinessProfile;
  generated: number;
  validated: number;
  keywords: RecommendKeyword[];
}

export default function RecommendPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (profile: {
    industry: string;
    region: string;
    services: string[];
    targetCustomer?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "키워드 추천 실패");
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
        <h2 className="text-2xl font-bold tracking-tight">AI 키워드 추천</h2>
        <p className="text-muted-foreground mt-1">
          업종과 서비스 정보를 입력하면 AI가 최적의 SEO 키워드를 추천합니다.
        </p>
      </div>

      <ProfileForm onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>AI 키워드 생성 + 검색광고 API 검증 중...</p>
          <p className="text-xs">30~50개 키워드를 생성하고 일괄 검증하므로 20~30초 소요될 수 있습니다.</p>
        </div>
      )}

      {result && !isLoading && (
        <RecommendResult
          generated={result.generated}
          validated={result.validated}
          keywords={result.keywords}
        />
      )}
    </div>
  );
}
