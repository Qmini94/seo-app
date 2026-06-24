import { getBrowser } from "./browser.pool";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
    await page.setUserAgent(UA);
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
 *
 * 네이버 블로그는 iframe 구조라서 메인 프레임 HTML에 본문이 없음.
 * → iframe#mainFrame 내부 HTML을 가져와야 실제 콘텐츠가 포함됨.
 * → 블로그가 아닌 일반 웹페이지는 메인 프레임 HTML을 반환.
 */
export async function crawlContentPage(url: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // 네이버 블로그: iframe#mainFrame 안에 본문이 있음
    if (url.includes("blog.naver.com")) {
      const blogHtml = await extractNaverBlogContent(page);
      if (blogHtml) return blogHtml;
    }

    // 일반 웹페이지
    return await page.content();
  } finally {
    await page.close();
  }
}

/**
 * 네이버 블로그 iframe 내부 HTML 추출
 * blog.naver.com은 #mainFrame iframe 안에 실제 본문이 있다.
 */
async function extractNaverBlogContent(page: import("puppeteer").Page): Promise<string | null> {
  try {
    // mainFrame iframe 찾기
    const mainFrame = page.frames().find((f) => {
      const frameUrl = f.url();
      return frameUrl.includes("PostView.naver") || frameUrl.includes("PostList.naver");
    });

    if (!mainFrame) return null;

    // 본문 영역 로딩 대기
    await mainFrame.waitForSelector(".se-main-container, #postViewArea, .post_ct", { timeout: 5000 }).catch(() => {});

    return await mainFrame.content();
  } catch {
    return null;
  }
}
