"use client";

import { useState } from "react";
import { Button } from "@ui/button";
import { Input } from "@ui/input";

interface Props {
  onSubmit: (profile: {
    industry: string;
    region: string;
    services: string[];
    targetCustomer?: string;
  }) => void;
  isLoading: boolean;
}

export default function ProfileForm({ onSubmit, isLoading }: Props) {
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const services = servicesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!industry.trim() || !region.trim() || services.length === 0) return;

    onSubmit({
      industry: industry.trim(),
      region: region.trim(),
      services,
      targetCustomer: targetCustomer.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-background p-6 space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold">고객 프로필</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">업종 *</label>
        <Input
          placeholder="예: 보일러 시공"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">지역 *</label>
        <Input
          placeholder="예: 포항"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">주요 서비스 * (쉼표로 구분)</label>
        <Input
          placeholder="예: 보일러 교체, 난방배관 수리, 보일러 AS"
          value={servicesText}
          onChange={(e) => setServicesText(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">타겟 고객 (선택)</label>
        <Input
          placeholder="예: 아파트 주민, 상가 건물주"
          value={targetCustomer}
          onChange={(e) => setTargetCustomer(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading || !industry.trim() || !region.trim() || !servicesText.trim()}>
        {isLoading ? "AI 분석 중..." : "키워드 추천 받기"}
      </Button>
    </form>
  );
}
