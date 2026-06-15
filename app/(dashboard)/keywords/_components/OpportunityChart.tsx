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
} from "recharts";
import type { RelatedKeyword } from "@/services/naver/searchAd";

interface Props {
  keywords: RelatedKeyword[];
}

const competitionValue: Record<string, number> = {
  낮음: 1,
  중간: 2,
  높음: 3,
};

const competitionLabel: Record<number, string> = {
  1: "낮음",
  2: "중간",
  3: "높음",
};

// 기회 영역: 검색량 높고 경쟁도 낮을수록 좋은 색상
function getDotColor(competition: number): string {
  if (competition === 1) return "hsl(142, 71%, 45%)"; // 녹색 — 낮음 = 기회
  if (competition === 2) return "hsl(38, 92%, 50%)";  // 주황 — 중간
  return "hsl(0, 84%, 60%)";                           // 빨강 — 높음 = 경쟁 치열
}

interface ChartItem {
  keyword: string;
  searchVolume: number;
  competition: number;
  totalClick: number;
}

export default function OpportunityChart({ keywords }: Props) {
  const data: ChartItem[] = keywords
    .filter((kw) => kw.competition in competitionValue)
    .map((kw) => ({
      keyword: kw.keyword,
      searchVolume: kw.monthlyTotalSearch,
      competition: competitionValue[kw.competition],
      totalClick: kw.monthlyAveTotalClick,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">기회 매트릭스</h3>
      <p className="text-sm text-muted-foreground mb-4">
        왼쪽 아래(검색량 낮음·경쟁 낮음) → 오른쪽 아래(검색량 높음·경쟁 낮음)가 기회 영역
      </p>
      <div className="rounded-md border p-4 bg-background">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
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
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data}>
              {data.map((item, i) => (
                <Cell
                  key={i}
                  fill={getDotColor(item.competition)}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartItem;
  return (
    <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
      <p className="font-semibold">{d.keyword}</p>
      <p>월간 검색량: {d.searchVolume.toLocaleString("ko-KR")}</p>
      <p>경쟁도: {competitionLabel[d.competition]}</p>
      <p>월간 클릭: {d.totalClick.toLocaleString("ko-KR")}</p>
    </div>
  );
}
