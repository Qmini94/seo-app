import puppeteer, { type Browser } from "puppeteer";

let browserInstance: Browser | null = null;

/**
 * 브라우저 싱글턴 — 매번 새로 띄우면 느리니까 재사용한다.
 * 프로세스 종료 시 자동 정리.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
