import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const BASE_URL = 'http://localhost:5173'; // change if using Vite (5173) or Netlify CLI (8888)

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/about`);
  });

  // GENERAL TESTS
  test('renders About page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /about us/i });
    await expect(heading).toBeVisible();
  });

  test('renders Meet the Owner section with image', async ({ page }) => {
    const ownerHeading = page.getByRole('heading', { name: /meet the owner/i });
    await expect(ownerHeading).toBeVisible();

    const ownerImage = page.getByRole('img', { name: /sabina ackah/i });
    await expect(ownerImage).toBeVisible();
  });

  test('renders Our Story section', async ({ page }) => {
    const storyHeading = page.getByRole('heading', { name: /our story/i });
    await expect(storyHeading).toBeVisible();
    await expect(page.getByText(/memorable experiences/i)).toBeVisible();
  });

  test('renders Instagram feed section', async ({ page }) => {
    const instaHeading = page.getByRole('heading', { name: /our highlights/i });
    await expect(instaHeading).toBeVisible();
  });

  test('no severe console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
  });

  // ACCESSIBILITY TEST
  test('should have no automatically detectable accessibility violations', async ({ page }) => {
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });
});
