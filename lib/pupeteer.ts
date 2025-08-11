import puppeteer from "puppeteer-core";
import chrome from "chrome-aws-lambda";

export async function startBrowser() {
  const executablePath = await chrome.executablePath;

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: executablePath || undefined,
    headless: chrome.headless,
  });

  const page = await browser.newPage();
  return { browser, page };
}
