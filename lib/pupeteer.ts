import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Use any type to avoid type conflicts between puppeteer and puppeteer-core
let browserInstance: any = null;

export async function startBrowser(): Promise<{ browser: any; page: any }> {
  try {
    // Reuse existing browser instance if available
    if (browserInstance && browserInstance.isConnected()) {
      const page = await browserInstance.newPage();
      return { browser: browserInstance, page };
    }

    // Determine if we're running locally or on Vercel
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    
    let browser: any;

    if (isLocal) {
      // Local development - use regular puppeteer
      const puppeteerLocal = await import('puppeteer');
      browser = await puppeteerLocal.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    } else {
      // Production/Vercel - use chromium
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
        ignoreHTTPSErrors: true,
      });
    }

    browserInstance = browser;
    const page = await browser.newPage();

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return { browser, page };
  } catch (error) {
    console.error('Error starting browser:', error);
    throw new Error(`Failed to start browser: ${error}`);
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Helper function to handle page cleanup
export async function closePage(page: any): Promise<void> {
  try {
    if (!page.isClosed()) {
      await page.close();
    }
  } catch (error) {
    console.error('Error closing page:', error);
  }
}

// Utility function for common page setup
export async function setupPage(page: any): Promise<void> {
  // Block images, fonts, and other resources to speed up scraping
  await page.setRequestInterception(true);
  
  page.on('request', (req: any) => {
    const resourceType = req.resourceType();
    if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
}