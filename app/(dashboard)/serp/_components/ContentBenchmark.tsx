"use client";

import type { ContentStructure } from "@/features/serp/serp.types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  structures: ContentStructure[];
  keyword: string;
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  list: "리스트",
  table: "비교표",
  faq: "FAQ",
  step: "스텝",
  general: "일반",
};

export default function ContentBenchmark({ structures, keyword }: Props) {
  if (structures.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        상위 콘텐츠를 크롤링하지 못했습니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">상위 콘텐츠 벤치마크</h3>
        <Badge variant="outline">{structures.length}개 분석</Badge>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="min-w-[200px]">URL</TableHead>
              <TableHead className="text-right">글자수</TableHead>
              <TableHead className="text-right">키워드</TableHead>
              <TableHead className="text-right">밀도</TableHead>
              <TableHead className="text-right">제목</TableHead>
              <TableHead className="text-right">H2</TableHead>
              <TableHead className="text-right">이미지</TableHead>
              <TableHead>형태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structures.map((s, i) => (
              <TableRow key={s.url}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                  {s.url}
                </TableCell>
                <TableCell className="text-right">
                  {s.textLength.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{s.keywordCount}회</TableCell>
                <TableCell className="text-right">{s.keywordDensity}%</TableCell>
                <TableCell className="text-right">{s.titleLength}자</TableCell>
                <TableCell className="text-right">{s.h2Count}</TableCell>
                <TableCell className="text-right">{s.imageCount}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CONTENT_TYPE_LABEL[s.contentType] ?? s.contentType}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
