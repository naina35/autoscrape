import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function startBrowser(): Promise<{ browser: Browser; page: Page }> {
  const isServerless = !!process.env.AWS_EXECUTION_ENV;

  const viewport = {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
  };

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
  executablePath: executablePath || undefined,
  args: isServerless ? chromium.args : [],
  headless: isServerless ? ("shell" as any) : true,
  defaultViewport: viewport,
  ignoreHTTPSErrors: true,
});


  const page = await browser.newPage();
  return { browser, page };
}
