"use client";

import { useState, useMemo } from "react";
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

interface Props {
  seed: string;
  keywords: RelatedKeyword[];
}

const competitionColor: Record<string, string> = {
  높음: "destructive",
  중간: "secondary",
  낮음: "default",
};

type SortKey =
  | "keyword"
  | "monthlyTotalSearch"
  | "monthlyPcSearch"
  | "monthlyMobileSearch"
  | "competition"
  | "monthlyAveTotalClick"
  | "pcCtr"
  | "mobileCtr"
  | "intent";

const intentOrder: Record<SearchIntent, number> = {
  transactional: 4,
  commercial: 3,
  informational: 2,
  navigational: 1,
};

const intentColor: Record<SearchIntent, string> = {
  transactional: "destructive",
  commercial: "default",
  informational: "secondary",
  navigational: "outline",
};

type SortDir = "asc" | "desc";

const competitionOrder: Record<string, number> = {
  높음: 3,
  중간: 2,
  낮음: 1,
};

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

function formatPercent(n: number): string {
  return n > 0 ? `${n.toFixed(2)}%` : "-";
}

export default function KeywordResult({ seed, keywords }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("monthlyTotalSearch");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCompetition, setFilterCompetition] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filterCompetition === "all") return keywords;
    return keywords.filter((kw) => kw.competition === filterCompetition);
  }, [keywords, filterCompetition]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "keyword") {
        cmp = a.keyword.localeCompare(b.keyword, "ko");
      } else if (sortKey === "competition") {
        cmp =
          (competitionOrder[a.competition] ?? 0) -
          (competitionOrder[b.competition] ?? 0);
      } else if (sortKey === "intent") {
        cmp = (intentOrder[a.intent] ?? 0) - (intentOrder[b.intent] ?? 0);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  if (keywords.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        &quot;{seed}&quot;에 대한 연관 키워드가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">연관 키워드</h3>
          <Badge variant="outline">{sorted.length}개</Badge>
          {filterCompetition !== "all" && (
            <Badge variant="outline">
              전체 {keywords.length}개 중 필터링
            </Badge>
          )}
        </div>

        <select
          value={filterCompetition}
          onChange={(e) => setFilterCompetition(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm bg-background"
        >
          <option value="all">경쟁도: 전체</option>
          <option value="낮음">경쟁도: 낮음</option>
          <option value="중간">경쟁도: 중간</option>
          <option value="높음">경쟁도: 높음</option>
        </select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="keyword" label="키워드" className="w-[240px]" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="monthlyTotalSearch" label="월간 검색량" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="monthlyPcSearch" label="PC" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="monthlyMobileSearch" label="모바일" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="competition" label="경쟁도" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="monthlyAveTotalClick" label="월간 클릭" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="pcCtr" label="PC CTR" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="mobileCtr" label="모바일 CTR" className="text-right" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
              <SortableHead sortKey="intent" label="검색 의도" currentKey={sortKey} indicator={sortIndicator} onClick={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((kw) => (
              <TableRow key={kw.keyword}>
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(kw.monthlyTotalSearch)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(kw.monthlyPcSearch)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(kw.monthlyMobileSearch)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      (competitionColor[kw.competition] as any) ?? "outline"
                    }
                  >
                    {kw.competition || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(kw.monthlyAveTotalClick)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatPercent(kw.pcCtr)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatPercent(kw.mobileCtr)}
                </TableCell>
                <TableCell>
                  <Badge variant={(intentColor[kw.intent] as any) ?? "outline"}>
                    {INTENT_LABEL[kw.intent]}
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

function SortableHead({
  sortKey,
  label,
  className = "",
  currentKey,
  indicator,
  onClick,
}: {
  sortKey: SortKey;
  label: string;
  className?: string;
  currentKey: SortKey;
  indicator: (key: SortKey) => string;
  onClick: (key: SortKey) => void;
}) {
  return (
    <TableHead
      className={`${className} cursor-pointer select-none hover:bg-muted/50`}
      onClick={() => onClick(sortKey)}
    >
      {label}
      <span className="text-xs">{indicator(sortKey)}</span>
    </TableHead>
  );
}
