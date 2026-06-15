import crypto from "node:crypto";

const BASE_URL = "https://api.searchad.naver.com";
const API_KEY = process.env.NAVER_AD_API_KEY!;
const SECRET_KEY = process.env.NAVER_AD_SECRET_KEY!;
const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID!;

// 네이버 검색광고 서명: HMAC-SHA256("timestamp.method.uri") → base64
function generateSignature(timestamp: string, method: string, uri: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
}

function buildHeaders(method: string, uri: string): Record<string, string> {
  const timestamp = Date.now().toString();
  return {
    "X-Timestamp": timestamp,
    "X-API-KEY": API_KEY,
    "X-Customer": CUSTOMER_ID,
    "X-Signature": generateSignature(timestamp, method, uri),
  };
}

export interface RelatedKeyword {
  keyword: string;
  monthlyPcSearch: number;
  monthlyMobileSearch: number;
  monthlyTotalSearch: number;
  competition: string; // 높음 / 중간 / 낮음
  monthlyAvePcClick: number; // 월평균 PC 클릭수
  monthlyAveMobileClick: number; // 월평균 모바일 클릭수
  monthlyAveTotalClick: number; // 월평균 총 클릭수
  pcCtr: number; // PC 클릭률 (%)
  mobileCtr: number; // 모바일 클릭률 (%)
}

// 네이버는 검색량 적은 키워드에 숫자 대신 "< 10" 문자열을 준다 → 숫자로 정리
function parseCount(v: number | string): number {
  if (typeof v === "number") return v;
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

export async function getRelatedKeywords(seed: string): Promise<RelatedKeyword[]> {
  const uri = "/keywordstool";
  const params = new URLSearchParams({
    hintKeywords: seed.replace(/\s/g, ""), // 네이버는 공백 제거 권장
    showDetail: "1",
  });

  const res = await fetch(`${BASE_URL}${uri}?${params}`, {
    method: "GET",
    headers: buildHeaders("GET", uri), // 서명은 쿼리 없는 path만!
  });

  if (!res.ok) {
    throw new Error(`Naver SearchAd API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const list = (data.keywordList ?? []) as any[];

  return list.map((k) => {
    const pc = parseCount(k.monthlyPcQcCnt);
    const mobile = parseCount(k.monthlyMobileQcCnt);
    const pcClick = parseFloat(k.monthlyAvePcClkCnt) || 0;
    const mobileClick = parseFloat(k.monthlyAveMobileClkCnt) || 0;
    const pcCtr = parseFloat(k.monthlyAvePcCtr) || 0;
    const mobileCtr = parseFloat(k.monthlyAveMobileCtr) || 0;
    return {
      keyword: k.relKeyword,
      monthlyPcSearch: pc,
      monthlyMobileSearch: mobile,
      monthlyTotalSearch: pc + mobile,
      competition: k.compIdx,
      monthlyAvePcClick: pcClick,
      monthlyAveMobileClick: mobileClick,
      monthlyAveTotalClick: Math.round(pcClick + mobileClick),
      pcCtr,
      mobileCtr,
    };
  });
}