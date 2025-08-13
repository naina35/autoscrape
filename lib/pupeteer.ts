import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function startBrowser(): Promise<{ browser: Browser; page: Page }> {
  const viewport = {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
  };

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: true,  // Just set this directly to true for Vercel
    defaultViewport: viewport,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  return { browser, page };
}