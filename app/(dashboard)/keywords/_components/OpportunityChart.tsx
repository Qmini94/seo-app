"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea,
  ZAxis,
} from "recharts";
import type { RelatedKeyword, Competition } from "@core/keyword";
import { INTENT_LABEL } from "@core/keyword";

interface Props {
  keywords: RelatedKeyword[];
}

const competitionValue: Record<Competition, number> = {
  낮음: 1,
  중간: 2,
  높음: 3,
};

const competitionLabel: Record<number, string> = {
  1: "낮음",
  2: "중간",
  3: "높음",
};

function getDotColor(opportunity: number): string {
  if (opportunity >= 60) return "hsl(142, 71%, 45%)"; // 녹색 — 높은 기회
  if (opportunity >= 30) return "hsl(38, 92%, 50%)";  // 주황 — 중간
  return "hsl(0, 84%, 60%)";                           // 빨강 — 낮은 기회
}

interface ChartItem {
  keyword: string;
  searchVolume: number;
  competition: number;
  relevance: number;
  opportunity: number;
  intent: string;
  totalClick: number;
}

export default function OpportunityChart({ keywords }: Props) {
  const data: ChartItem[] = keywords
    .filter((kw) => kw.competition in competitionValue)
    .map((kw) => ({
      keyword: kw.keyword,
      searchVolume: kw.monthlyTotalSearch,
      competition: competitionValue[kw.competition],
      relevance: kw.relevance,
      opportunity: kw.opportunity,
      intent: INTENT_LABEL[kw.intent],
      totalClick: kw.monthlyAveTotalClick,
    }));

  if (data.length === 0) return null;

  const maxSearch = Math.max(...data.map((d) => d.searchVolume));
  // 골든존 기준: 검색량 상위 50% & 경쟁도 낮음 영역
  const goldenX = maxSearch * 0.3;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">기회 매트릭스</h3>
      <p className="text-sm text-muted-foreground mb-4">
        점 크기 = 관련성, 색상 = 기회 점수. 초록 영역이 골든존 (검색량↑ 경쟁도↓)
      </p>
      <div className="rounded-md border p-4 bg-background">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* 골든존 하이라이트 */}
            <ReferenceArea
              x1={goldenX}
              x2={maxSearch * 1.05}
              y1={0.5}
              y2={1.5}
              fill="hsl(142, 71%, 45%)"
              fillOpacity={0.08}
              strokeOpacity={0}
            />
            <XAxis
              type="number"
              dataKey="searchVolume"
              name="월간 검색량"
              tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
              label={{ value: "월간 검색량", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="competition"
              name="경쟁도"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v: number) => competitionLabel[v] ?? ""}
              label={{ value: "경쟁도", angle: -90, position: "insideLeft" }}
            />
            {/* 점 크기 = 관련성 (0~100 → 30~400 범위) */}
            <ZAxis
              type="number"
              dataKey="relevance"
              range={[30, 400]}
              name="관련성"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data}>
              {data.map((item, i) => (
                <Cell
                  key={i}
                  fill={getDotColor(item.opportunity)}
                  fillOpacity={0.75}
                  stroke={getDotColor(item.opportunity)}
                  strokeOpacity={0.3}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
          기회 높음 (60+)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(38, 92%, 50%)" }} />
          중간 (30~59)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
          낮음 (0~29)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border border-muted-foreground" style={{ width: "8px", height: "8px" }} />
          작은 점 = 관련성 낮음
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full border border-muted-foreground" />
          큰 점 = 관련성 높음
        </span>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartItem }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover p-3 text-sm shadow-md space-y-1">
      <p className="font-semibold">{d.keyword}</p>
      <p>기회 점수: <span className="font-semibold">{d.opportunity}</span></p>
      <p>월간 검색량: {d.searchVolume.toLocaleString("ko-KR")}</p>
      <p>경쟁도: {competitionLabel[d.competition]}</p>
      <p>관련성: {d.relevance}</p>
      <p>검색 의도: {d.intent}</p>
      <p>월간 클릭: {d.totalClick.toLocaleString("ko-KR")}</p>
    </div>
  );
}
