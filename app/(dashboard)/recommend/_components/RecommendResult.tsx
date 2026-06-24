"use client";

import type { RelatedKeyword } from "@/features/keyword/keyword.types";
import { INTENT_LABEL, type SearchIntent } from "@/features/keyword/intent.classifier";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecommendKeyword extends RelatedKeyword {
  category: string;
}

interface Props {
  generated: number;
  validated: number;
  keywords: RecommendKeyword[];
}

const intentColor: Record<SearchIntent, string> = {
  transactional: "destructive",
  commercial: "default",
  informational: "secondary",
  navigational: "outline",
};

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function RecommendResult({ generated, validated, keywords }: Props) {
  if (keywords.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        검증된 키워드가 없습니다. 프로필을 수정해보세요.
      </div>
    );
  }

  // 카테고리별 그룹핑
  const categories = [...new Set(keywords.map((k) => k.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">추천 키워드</h3>
        <Badge variant="outline">AI 생성 {generated}개</Badge>
        <Badge variant="default">검증 통과 {validated}개</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge key={cat} variant="secondary">
            {cat} ({keywords.filter((k) => k.category === cat).length})
          </Badge>
        ))}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">키워드</TableHead>
              <TableHead className="text-right">기회 점수</TableHead>
              <TableHead className="text-right">월간 검색량</TableHead>
              <TableHead>경쟁도</TableHead>
              <TableHead className="text-right">관련성</TableHead>
              <TableHead>검색 의도</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>SERP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw) => (
              <TableRow key={kw.keyword}>
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell className="text-right">
                  <span className={
                    kw.opportunity >= 60 ? "font-bold text-green-600" :
                    kw.opportunity >= 30 ? "font-semibold" :
                    "text-muted-foreground"
                  }>
                    {kw.opportunity}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(kw.monthlyTotalSearch)}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    kw.competition === "높음" ? "destructive" :
                    kw.competition === "중간" ? "secondary" : "default"
                  }>
                    {kw.competition || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={kw.relevance >= 70 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                    {kw.relevance}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={(intentColor[kw.intent] as any) ?? "outline"}>
                    {INTENT_LABEL[kw.intent]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{kw.category}</Badge>
                </TableCell>
                <TableCell>
                  <a
                    href={`/serp?keyword=${encodeURIComponent(kw.keyword)}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    분석
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
