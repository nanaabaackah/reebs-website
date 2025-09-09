import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174/';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('renders hero heading', async ({ page }) => {
    const heroHeading = page.getByRole('heading', { name: /reebs party themes/i });
    await expect(heroHeading).toBeVisible();
  });

  test('renders hero navigation links', async ({ page }) => {
    await expect(page.getByText(/view rentals/i)).toBeVisible();
    await expect(page.getByText(/explore our shop/i)).toBeVisible();
    await expect(page.getByText(/contact us/i)).toBeVisible();
  });

  test('shows "Why Choose Us" section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /why choose us/i })).toBeVisible();
  });

  test('shows "Our Services" section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /our services/i })).toBeVisible();
    await expect(page.getByText(/party equipment rentals/i)).toBeVisible();
  });

  test('skip link exists in DOM', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
  });

  test('no severe console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    // allow React warnings but no fatal errors
    expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
  });
});
