import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility checks', () => {
  test('Home page should have no a11y violations', async ({ page }) => {
    // Adjust if you use Vite/CRA/Netlify preview etc.
    await page.goto('http://localhost:5174/');

    // Inject axe-core into the page
    await injectAxe(page);

    // Run accessibility check
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
});
