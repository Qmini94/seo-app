"use client";

import type { ContentStructure } from "@core/serp/serp.types";
import { Badge } from "@ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table";

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
        <span className="text-xs text-muted-foreground">
          &quot;{keyword}&quot; 상위 노출 + AI 인용 콘텐츠 구조
        </span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="min-w-[180px]">소스</TableHead>
              <TableHead className="text-right">글자수</TableHead>
              <TableHead className="text-right">키워드</TableHead>
              <TableHead className="text-right">밀도</TableHead>
              <TableHead className="text-right">H2</TableHead>
              <TableHead className="text-right">이미지</TableHead>
              <TableHead>형태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structures.map((s, i) => (
              <TableRow key={s.url} className={s.aiCited ? "bg-blue-50/50 dark:bg-blue-950/30" : ""}>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {i + 1}
                    {s.aiCited && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-tight">
                        AI
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate max-w-[250px]"
                    title={s.url}
                  >
                    {s.domain}
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {s.textLength.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {s.keywordCount}회
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {s.keywordDensity}%
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{s.h2Count}</TableCell>
                <TableCell className="text-right font-mono text-xs">{s.imageCount}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
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
