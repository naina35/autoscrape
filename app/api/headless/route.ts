export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { startBrowser } from '@/lib/pupeteer';

export async function GET() {
  const { browser, page } = await startBrowser();
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  const title = await page.title();

  await browser.close();

  return NextResponse.json({ title });
}
