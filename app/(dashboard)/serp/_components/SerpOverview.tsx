"use client";

import type { SerpAnalysis } from "@core/serp/serp.types";
import { SECTION_LABEL } from "@core/serp/serp.types";
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
  serpAnalysis: SerpAnalysis;
}

export default function SerpOverview({ serpAnalysis: serp }: Props) {
  return (
    <div className="rounded-lg border bg-background p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">SERP 구조</h3>
        <Badge variant="outline">{serp.totalSections}개 영역</Badge>
        {serp.aiBriefing.exists && (
          <Badge variant="secondary">AI 브리핑 활성</Badge>
        )}
      </div>

      {serp.sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">SERP 영역을 파싱하지 못했습니다.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">순서</TableHead>
                <TableHead>영역</TableHead>
                <TableHead className="text-right">결과 수</TableHead>
                <TableHead>상위 결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serp.sections.map((section) => (
                <TableRow key={`${section.type}-${section.position}`}>
                  <TableCell className="text-muted-foreground">
                    {section.position}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SECTION_LABEL[section.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {section.results.length}
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    {section.results.slice(0, 3).map((r) => (
                      <div key={r.rank} className="text-xs truncate">
                        {r.rank}.{" "}
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {r.title || r.domain}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{r.title}</span>
                        )}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {serp.aiBriefing.exists && serp.aiBriefing.citedUrls.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">AI 브리핑 인용 소스</p>
          <div className="space-y-1">
            {serp.aiBriefing.citedUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
