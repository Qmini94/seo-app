"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSearch: (seed: string) => void;
  isLoading: boolean;
}

export default function KeywordSearch({ onSearch, isLoading }: Props) {
  const [seed, setSeed] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = seed.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg">
      <Input
        placeholder="시드 키워드 입력 (예: 피부과, 전세자금대출)"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !seed.trim()}>
        {isLoading ? "분석 중..." : "분석"}
      </Button>
    </form>
  );
}
