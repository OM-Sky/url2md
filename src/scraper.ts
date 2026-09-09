import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Remove unwanted elements before conversion
const REMOVE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  'script', 'style', 'noscript',
  '[class*="ad"]', '[class*="banner"]', '[class*="promo"]',
  '[id*="ad"]', '[id*="banner"]',
  '.sidebar', '.cookie', '.popup', '.modal',
];

export interface ScrapeResult {
  markdown: string;
  title: string;
  url: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; url2md/1.0; +https://url2md.up.railway.app)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    // 10s timeout
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Non-HTML content type: ${contentType}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('title').text().trim() || $('h1').first().text().trim() || url;

  // Remove noise elements
  REMOVE_SELECTORS.forEach((sel) => $(sel).remove());

  // Try to get the main content area, fall back to body
  const mainContent =
    $('main').html() ||
    $('article').html() ||
    $('[role="main"]').html() ||
    $('body').html() ||
    '';

  const markdown = turndown.turndown(mainContent);

  return { markdown, title, url };
}
