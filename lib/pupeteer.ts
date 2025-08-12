// lib/puppeteer.ts
import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function startBrowser(): Promise<{ browser: Browser; page: Page }> {
  const isServerless = !!process.env.AWS_EXECUTION_ENV; // Detect if running in AWS Lambda / Vercel

  const executablePath = isServerless
    ? await chromium.executablePath() // Sparticuz's method returns Promise<string>
    : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // Local dev path

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: isServerless ? chromium.args : [],
  });

  const page = await browser.newPage();
  return { browser, page };
}
