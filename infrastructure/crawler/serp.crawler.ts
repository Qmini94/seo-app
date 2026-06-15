import { getBrowser } from "./browser.pool";

/**
 * 네이버 통합검색 결과 페이지의 원본 HTML을 가져온다.
 *
 * 주의:
 * - 네이버는 봇 감지가 있어서 User-Agent 설정 + 적당한 딜레이 필요
 * - 과도한 크롤링은 IP 차단 → 우선순위 키워드(20~50개)만 대상
 */
export async function crawlNaverSerp(keyword: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // 동적 콘텐츠 로딩 대기
    await page.waitForSelector("#main_pack", { timeout: 5000 }).catch(() => {});

    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}

/**
 * 개별 콘텐츠 URL의 HTML을 가져온다.
 * SERP 상위 결과 페이지를 크롤링하여 콘텐츠 구조를 분석할 때 사용.
 */
export async function crawlContentPage(url: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}
