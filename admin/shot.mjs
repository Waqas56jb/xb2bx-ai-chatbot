import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Login page
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: 'shot-login.png' });

// Log in with the admin token
const input = await page.$('input');
if (input) {
  await input.fill('change-me-to-a-long-random-string');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'shot-dashboard.png' });

  // Navigate to a couple of pages if links exist
  for (const [name, file] of [['Conversations', 'shot-conversations.png'], ['Training', 'shot-training.png'], ['Settings', 'shot-settings.png']]) {
    const link = page.getByText(name, { exact: false }).first();
    if (await link.count()) {
      await link.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: file });
    }
  }
}

await browser.close();
console.log('done');
