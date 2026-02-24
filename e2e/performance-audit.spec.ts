import { test, expect } from './fixtures/auth.fixture';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  tti: number; // Time to Interactive (approximated)
  domContentLoaded: number;
  load: number;
}

async function getPerformanceMetrics(page: any): Promise<PerformanceMetrics> {
  // Get navigation timing
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
    };
  });

  // Get paint timing
  const paintMetrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find((e) => e.name === 'first-contentful-paint');
    return {
      fcp: fcp ? fcp.startTime : 0,
    };
  });

  // Get LCP using PerformanceObserver data if available
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 500);
    });
  });

  // Get CLS
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 500);
    });
  });

  return {
    fcp: paintMetrics.fcp,
    lcp: lcp as number,
    cls: cls as number,
    tti: timing.domContentLoaded, // Approximation
    domContentLoaded: timing.domContentLoaded,
    load: timing.load,
  };
}

// Performance thresholds (in ms, except CLS which is unitless)
const THRESHOLDS = {
  fcp: 1800,    // Good: < 1.8s
  lcp: 2500,    // Good: < 2.5s
  cls: 0.1,     // Good: < 0.1
  tti: 3800,    // Good: < 3.8s
};

test.describe('Performance Audit', () => {
  const pagesToAudit = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'People', path: '/people' },
    { name: 'Goals', path: '/goals' },
    { name: 'Meetings', path: '/meetings' },
    { name: 'Calendar', path: '/events' },
  ];

  for (const pageInfo of pagesToAudit) {
    test(`${pageInfo.name} - Performance metrics`, async ({ page, loginAs }) => {
      // Login first
      await loginAs('admin');

      // Clear cache for accurate measurement
      const client = await page.context().newCDPSession(page);
      await client.send('Network.clearBrowserCache');

      await page.goto(pageInfo.path, {
        waitUntil: 'domcontentloaded',
      });

      // Wait for page to fully settle
      await page.waitForTimeout(1000);

      const metrics = await getPerformanceMetrics(page);

      console.log(`\n=== ${pageInfo.name} Performance Metrics ===`);
      console.log(`  FCP (First Contentful Paint): ${metrics.fcp.toFixed(0)}ms ${metrics.fcp < THRESHOLDS.fcp ? '✅' : '⚠️'}`);
      console.log(`  LCP (Largest Contentful Paint): ${metrics.lcp.toFixed(0)}ms ${metrics.lcp < THRESHOLDS.lcp ? '✅' : '⚠️'}`);
      console.log(`  CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(3)} ${metrics.cls < THRESHOLDS.cls ? '✅' : '⚠️'}`);
      console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`);
      console.log(`  Page Load: ${metrics.load.toFixed(0)}ms`);

      // Assertions - warn but don't fail for now
      // These help track performance over time
      expect(metrics.fcp).toBeLessThan(THRESHOLDS.fcp * 2); // Allow 2x threshold for dev server
      expect(metrics.cls).toBeLessThan(THRESHOLDS.cls * 2);
    });
  }
});

test.describe('Bundle Size Check', () => {
  test('Check main bundle sizes', async ({ browser }) => {
    // Create a fresh context with no cache to capture all resources
    const context = await browser.newContext();
    const page = await context.newPage();

    const resources: { url: string; size: number; type: string }[] = [];

    // Set up response listener BEFORE any navigation
    page.on('response', async (response) => {
      const url = response.url();
      // Match JS and CSS files, excluding source maps
      if (url.includes('localhost') &&
          (url.match(/\.js(\?|$)/) || url.match(/\.css(\?|$)/)) &&
          !url.includes('.map')) {
        try {
          const buffer = await response.body();
          const fileName = url.split('/').pop()?.split('?')[0] || url;
          resources.push({
            url: fileName,
            size: buffer.length,
            type: url.match(/\.js(\?|$)/) ? 'JS' : 'CSS',
          });
        } catch {
          // Ignore errors for cached resources
        }
      }
    });

    // Navigate directly to auth page (no login needed, just measuring bundle)
    await page.goto('/auth', { waitUntil: 'networkidle' });

    // Wait a moment for all resources to be captured
    await page.waitForTimeout(500);

    console.log('\n=== Bundle Sizes (Auth Page - Initial Load) ===');
    let totalJS = 0;
    let totalCSS = 0;

    resources
      .sort((a, b) => b.size - a.size)
      .forEach((r) => {
        const sizeKB = (r.size / 1024).toFixed(1);
        console.log(`  ${r.type} ${r.url}: ${sizeKB} KB`);
        if (r.type === 'JS') totalJS += r.size;
        if (r.type === 'CSS') totalCSS += r.size;
      });

    console.log(`\n  Total JS: ${(totalJS / 1024).toFixed(1)} KB`);
    console.log(`  Total CSS: ${(totalCSS / 1024).toFixed(1)} KB`);
    console.log(`  Combined: ${((totalJS + totalCSS) / 1024).toFixed(1)} KB`);

    // Estimate gzipped size (typically 30-40% of uncompressed)
    const estimatedGzipped = (totalJS + totalCSS) * 0.35;
    console.log(`  Estimated gzipped: ${(estimatedGzipped / 1024).toFixed(1)} KB`);

    await context.close();

    // Dev mode bundles are much larger than production (unminified, no tree-shaking)
    // Production builds should target < 500KB gzipped
    // Dev mode threshold: 10MB uncompressed (allows for dev tooling)
    expect(totalJS + totalCSS).toBeLessThan(10 * 1024 * 1024);

    // Report on bundle health
    console.log('\n=== Bundle Analysis ===');
    if (estimatedGzipped > 500 * 1024) {
      console.log('  ⚠️ Estimated gzipped bundle exceeds 500KB production target');
      console.log('  Consider:');
      console.log('    - Code splitting for recharts (1.2MB) - only load on Dashboard');
      console.log('    - Tree-shake lucide-react (1.1MB) - import specific icons');
      console.log('    - Lazy load heavy routes');
    } else {
      console.log('  ✅ Bundle size within target');
    }
  });
});
