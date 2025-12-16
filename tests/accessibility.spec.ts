import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const stubInventory = [
  { id: 1, name: 'Rainbow Balloon Set', type: 'Party Supplies', price: 50, quantity: 4, description: 'Colorful balloons for any party.', image_url: '/imgs/placeholder.png' },
  { id: 2, name: 'Cotton Candy Kit', type: 'Party Supplies', price: 120, quantity: 6, description: 'Everything you need for fluffy cotton candy.', image_url: '/imgs/placeholder.png' },
];

const stubRentals = [
  { id: 101, name: 'Mini Bouncy Castle', category: 'Kid Bouncers', price: '700-900', rate: 'per day', quantity: 2, status: 'Available', image: '/imgs/placeholder.png', page: '/Rentals/mini-bouncy-castle' },
  { id: 102, name: 'Cotton Candy Machine', category: 'Party Machines', price: 250, rate: 'per day', quantity: 3, status: 'Available', image: '/imgs/placeholder.png', page: '/Rentals/cotton-candy-machine' },
];

const mockData = async (page) => {
  await page.route('**/.netlify/functions/inventory', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stubInventory) })
  );
  await page.route('**/.netlify/functions/rentals', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stubRentals) })
  );
};

const dismissCookies = async (page) => {
  const accept = page.getByRole('button', { name: /accept cookies|save & continue/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
};

const runA11y = async (page) => {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
};

const pagesToScan = [
  '/',
  '/About',
  '/Shop',
  '/Rentals',
  '/Contact',
  '/faq',
  '/Gallery',
  '/delivery-policy',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy',
];

test.describe('Accessibility checks', () => {
  test.beforeEach(async ({ page }) => {
    await mockData(page);
  });

  for (const path of pagesToScan) {
    test(`should have no a11y violations: ${path}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(path);
      await dismissCookies(page);
      await page.waitForSelector('main, #policy-main', { state: 'visible' });
      await runA11y(page);
    });
  }
});
