import { NextRequest, NextResponse } from 'next/server';
import { startBrowser, closePage, setupPage } from '@/lib/pupeteer';

export async function POST(request: NextRequest) {
  let browser, page;

  try {
    // Get the browser and page
    const result = await startBrowser();
    browser = result.browser;
    page = result.page;

    // Setup the page with common configurations
    await setupPage(page);

    // Your scraping logic here
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Navigate to the URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Example scraping - get page title
    const title = await page.title();
    const content = await page.evaluate(() => {
      return document.body.innerText.slice(0, 1000); // First 1000 characters
    });

    return NextResponse.json({
      success: true,
      data: {
        title,
        content,
        url
      }
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error },
      { status: 500 }
    );
  } finally {
    // Always clean up the page
    if (page) {
      await closePage(page);
    }
  }
}

export const maxDuration = 30; // 30 seconds max execution time