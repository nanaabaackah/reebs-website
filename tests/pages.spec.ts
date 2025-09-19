import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const BASE_URL = 'http://localhost:5173'; // adjust if needed (5173 for Vite, 8888 for Netlify CLI)

// Utility: run axe a11y check
async function runA11y(page) {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
}

test.describe('REEBS Party Themes Pages', () => {
  // -----------------------------
  // HOME PAGE TESTS
  // -----------------------------
  test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
    });

    test('renders hero heading and buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /reebs/i })).toBeVisible();;
      await expect(page.getByText(/view rentals/i)).toBeVisible();
      await expect(page.getByText(/explore our shop/i)).toBeVisible();
      await expect(page.getByText(/contact us/i)).toBeVisible();
    });

    test('renders Why Choose Us and Services', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /why choose us/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /our services/i })).toBeVisible();
    });

    test('skip link exists in DOM', async ({ page }) => {
      const skipLink = page.getByRole('link', { name: /skip to main content/i });
      await expect(skipLink).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      expect(errors.join('\\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
      await runA11y(page);
    });
  });

  // -----------------------------
  // ABOUT PAGE TESTS
  // -----------------------------
  test.describe('About Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/about`);
    });

    test('renders About Us heading and intro text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /about us/i })).toBeVisible();
      await expect(page.getByText(/unforgettable celebrations/i)).toBeVisible();
    });

    test('renders Meet the Owner section with image', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /meet the owner/i })).toBeVisible();
      await expect(page.getByRole('img', { name: /sabina ackah/i })).toBeVisible();
    });

    test('renders Our Story section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /our story/i })).toBeVisible();
      await expect(page.getByText(/memorable experiences/i)).toBeVisible();
    });

    test('renders Instagram feed section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /our highlights/i })).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      expect(errors.join('\\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
      await runA11y(page);
    });
  });
});
