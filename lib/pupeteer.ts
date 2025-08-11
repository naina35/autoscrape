// lib/puppeteer.ts
import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "chrome-aws-lambda";

export async function startBrowser(): Promise<{ browser: Browser; page: Page }> {
  const executablePath =
    process.env.AWS_EXECUTION_ENV // Detect if running on AWS Lambda/Vercel
      ? await chromium.executablePath
      : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // Local dev path

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: chromium.args,
  });

  const page = await browser.newPage();
  return { browser, page };
}
