import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const stubInventory = [
  { id: 1, name: 'Rainbow Balloon Set', type: 'Party Supplies', price: 50, quantity: 4, description: 'Colorful balloons for any party.', image_url: '/imgs/placeholder.png' },
  { id: 2, name: 'Cotton Candy Kit', type: 'Party Supplies', price: 120, quantity: 6, description: 'Everything you need for fluffy cotton candy.', image_url: '/imgs/placeholder.png' },
  { id: 3, name: 'Kids Headphones', type: "Kid's Toys", price: 220, quantity: 3, description: 'Safe volume limit for kids.', image_url: '/imgs/placeholder.png' },
];

const stubRentals = [
  { id: 101, name: 'Mini Bouncy Castle', category: 'Kid Bouncers', price: '700-900', rate: 'per day', quantity: 2, status: 'Available', image: '/imgs/placeholder.png', page: '/Rentals/mini-bouncy-castle' },
  { id: 102, name: 'Cotton Candy Machine', category: 'Party Machines', price: 250, rate: 'per day', quantity: 3, status: 'Available', image: '/imgs/placeholder.png', page: '/Rentals/cotton-candy-machine' },
  { id: 103, name: 'Trampoline', category: 'Kid Bouncers', price: 600, rate: 'per hour', quantity: 1, status: 'Limited', image: '/imgs/placeholder.png', page: '/Rentals/trampoline' },
];

// Accessibility helper; share across page groups
async function runA11y(page: Page) {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
}

// Escape a string for safe use inside RegExp
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mockData = async (page: Page) => {
  await page.route('**/.netlify/functions/inventory', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stubInventory) })
  );
  await page.route('**/.netlify/functions/rentals', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stubRentals) })
  );
};

const dismissCookies = async (page: Page) => {
  const accept = page.getByRole('button', { name: /accept cookies|save & continue/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
};

const noFatalConsoleErrors = async (page: Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.reload();
  expect(errors.join('\n')).not.toMatch(/TypeError|ReferenceError/);
};

test.describe('REEBS Party Themes Pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockData(page);
  });

  // -----------------------------
  // HOME PAGE TESTS
  // -----------------------------
  test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await dismissCookies(page);
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
      await noFatalConsoleErrors(page);
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
      await dismissCookies(page);
    });

    test('renders hero heading and intro text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /sleek setups\. joyful memories\./i })).toBeVisible();
      await expect(page.getByText(/design-forward celebrations/i)).toBeVisible();
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
      await expect(page.getByRole('heading', { name: /our mission & promise/i })).toBeVisible();
      await expect(page.getByText(/memorable without the mayhem/i)).toBeVisible();
    });

    test('renders Instagram feed section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /gallery/i })).toBeVisible();
      await expect(page.locator('.gallery-card').first()).toBeVisible();
    });

    test('no fatal console errors', async ({ page }) => {
      await noFatalConsoleErrors(page);
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
      await dismissCookies(page);
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

    test('filters products and opens cart after add', async ({ page }) => {
      const products = page.locator('.shop-card');
      await expect(products.first()).toBeVisible();

      const firstName = (await products.first().locator('h3').innerText()).trim();
      const searchTerm = firstName.split(' ')[0] || firstName;

      await page.getByLabel(/search products/i).fill(searchTerm);
      await page.waitForTimeout(300);

      await expect(products.first()).toContainText(new RegExp(escapeRegex(searchTerm), 'i'));

      await products.first().getByRole('button', { name: /add to cart/i }).click();
      const cartDialog = page.getByRole('dialog', { name: /your cart/i });
      await expect(cartDialog).toBeVisible();
      await expect(cartDialog).toContainText(firstName);
    });

    test('applies a category filter chip when available', async ({ page }) => {
      const chips = page.locator('.filter-chips button');
      if ((await chips.count()) < 2) return; // only "All" exists

      const targetChip = chips.nth(1);
      const label = (await targetChip.innerText()).trim();
      await targetChip.click();

      await expect(page.locator('.shop-card .shop-pill').first()).toHaveText(new RegExp(escapeRegex(label), 'i'));
    });

    test('no fatal console errors', async ({ page }) => {
      await noFatalConsoleErrors(page);
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
      await dismissCookies(page);
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

    test('searches rentals and opens detail page', async ({ page }) => {
      const firstCard = page.locator('.rent-card').first();
      await expect(firstCard).toBeVisible();

      const rentalName = (await firstCard.locator('h3').innerText()).trim();
      const term = rentalName.split(' ')[0] || rentalName;

      await page.getByLabel(/search rental items/i).fill(term);
      await page.waitForTimeout(200);

      await expect(page.locator('.rent-card').first()).toContainText(new RegExp(escapeRegex(term), 'i'));

      await firstCard.click();
      await expect(page).toHaveURL(/\/Rentals\//i);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(new RegExp(escapeRegex(rentalName.split(' ')[0]), 'i'));
    });

    test('no fatal console errors', async ({ page }) => {
      await noFatalConsoleErrors(page);
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
  // CONTACT PAGE TESTS
  // -----------------------------
  test.describe('Contact Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact');
      await dismissCookies(page);
    });

    test('renders hero content and quick contact actions', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /contact reebs/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /call us/i })).toHaveAttribute('href', /tel:\+?233/);
      await expect(page.getByRole('link', { name: /whatsapp/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /plan my setup/i })).toBeVisible();
    });

    test('shows contact cards and social links', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /talk to a human/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /send a brief/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /instagram/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /tiktok/i })).toBeVisible();
    });

    test('contact form requires key fields', async ({ page }) => {
      await expect(page.getByLabel('Name')).toBeEditable();
      await expect(page.getByLabel('Name')).toBeRequired();
      await expect(page.getByLabel('Email')).toBeRequired();
      await expect(page.getByLabel('Phone number')).toBeRequired();
      await expect(page.getByLabel('What do you need?')).toBeRequired();
      await expect(page.getByLabel('Event date')).toBeRequired();
      await expect(page.getByLabel('Tell us more')).toBeRequired();
    });

    test('passes accessibility scan', async ({ page }) => {
      await page.waitForSelector('main', { state: 'visible' });
      test.setTimeout(60000);
      await runA11y(page);
    });
  });

  // -----------------------------
  // FAQ & POLICY PAGES
  // -----------------------------
  test.describe('FAQ and policies', () => {
    test('FAQ renders hero and first section', async ({ page }) => {
      await page.goto('/faq');
      await dismissCookies(page);
      await expect(page.getByRole('heading', { name: /reebs faq/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /planning & booking/i })).toBeVisible();
      await expect(page.getByText(/reserve rentals online/i)).toBeVisible();
    });

    const policyPages = [
      { path: '/delivery-policy', heading: /delivery policy/i },
      { path: '/privacy-policy', heading: /privacy policy/i },
      { path: '/terms-of-service', heading: /terms of service/i },
      { path: '/refund-policy', heading: /refund policy/i },
    ];

    for (const { path, heading } of policyPages) {
      test(`Policy page smoke: ${path}`, async ({ page }) => {
        await page.goto(path);
        await dismissCookies(page);
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.getByRole('main')).toBeVisible();
      });
    }
  });

  // -----------------------------
  // GALLERY PAGE
  // -----------------------------
  test.describe('Gallery Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/gallery');
      await dismissCookies(page);
    });

    test('renders hero and gallery grid', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /gallery/i })).toBeVisible();
      await expect(page.locator('.gallery-card').first()).toBeVisible();
    });

    test('opens lightbox from gallery card', async ({ page }) => {
      const firstCardButton = page.locator('.gallery-img-btn').first();
      await expect(firstCardButton).toBeVisible();
      await firstCardButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.press('Escape');
    });
  });
});
