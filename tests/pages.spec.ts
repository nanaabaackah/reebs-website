import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

// Accessibility helper
async function runA11y(page: Page) {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
}

test.describe('REEBS Party Themes Pages', () => {
  // -----------------------------
  // HOME PAGE TESTS
  // -----------------------------
  test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle'}); // ✅ relative
    });

    test('renders hero heading and buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /reebs/i })).toBeVisible();
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
      expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
  // Wait for the main content to load before scanning
      await page.waitForSelector('main', { state: 'visible' });

      // Extend just this test’s timeout (e.g., 60s)
      test.setTimeout(60000);

      await runA11y(page);
    });
  });

  // -----------------------------
  // ABOUT PAGE TESTS
  // -----------------------------
  test.describe('About Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/about'); // ✅ relative
    });

    test('renders About Us heading and intro text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /about us/i })).toBeVisible();
      await expect(page.getByText(/unforgettable celebrations/i)).toBeVisible();
    });

    test('renders Meet the Owner section with image', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /meet the owner/i })).toBeVisible();

      // More specific: match the portrait alt text
      await expect(
        page.getByRole('img', {
          name: /portrait of sabina ackah, founder of reebs party themes/i,
        })
      ).toBeVisible();
    });

    test('renders Our Story section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /our story/i })).toBeVisible();
      await expect(page.getByText(/memorable experiences/i)).toBeVisible();
    });

    test('renders Instagram feed section', async ({ page }) => {
      // Use the region labelled by "Our Highlights"
      await expect(
        page.getByRole('region', { name: /our highlights/i })
      ).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
      // Wait for the main content to load before scanning
      await page.waitForSelector('main', { state: 'visible' });

      // Extend just this test’s timeout (e.g., 60s)
      test.setTimeout(60000);

      await runA11y(page);
    });
  });

  // -----------------------------
  // SHOP PAGE TESTS
  // -----------------------------
  test.describe('Shop Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/shop'); // ✅ relative
    });

    test('renders Shop heading and intro text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /shop/i })).toBeVisible();
      await expect(page.getByText(/party supplies/i)).toBeVisible();
    });

    test('renders search bar and category filter', async ({ page }) => {
      await expect(page.getByPlaceholder(/search items/i)).toBeVisible();

      // Target the category filter specifically
      await expect(
        page.getByRole('combobox', { name: /category/i })
      ).toBeVisible();

      // Fallback if no accessible name is set:
      // await expect(page.locator('select.category-filter')).toBeVisible();
    });


    test('renders product cards if inventory is available', async ({ page }) => {
      const products = page.locator('.shop-card');
      await expect(products.first()).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
      // Wait for the main content to load before scanning
      await page.waitForSelector('main', { state: 'visible' });

      // Extend just this test’s timeout (e.g., 60s)
      test.setTimeout(60000);

      await runA11y(page);
    });
  });

  // -----------------------------
  // RENTALS PAGE TESTS
  // -----------------------------
  test.describe('Rentals Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/rentals'); // ✅ relative
    });

    test('renders Rentals heading and intro text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /rentals/i })).toBeVisible();
      await expect(page.getByText(/party rentals for kids and events/i)).toBeVisible();
    });

    test('renders side menu categories', async ({ page }) => {
      const sideMenu = page.locator('.side-menu');
      await expect(sideMenu).toBeVisible();
      await expect(sideMenu.locator('li').first()).toBeVisible();
    });

    test('renders rental cards for a category', async ({ page }) => {
      const rentalCard = page.locator('.rent-card').first();
      await expect(rentalCard).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.reload();
      expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
    });

    test('passes accessibility scan', async ({ page }) => {
      // Wait for the main content to load before scanning
      await page.waitForSelector('main', { state: 'visible' });

      // Extend just this test’s timeout (e.g., 60s)
      test.setTimeout(60000);

      await runA11y(page);
    });
  });
});
