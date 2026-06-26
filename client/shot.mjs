import { chromium } from 'playwright';
const browser = await chromium.launch();

// Widget welcome + chat
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.screenshot({ path: 'shot-welcome.png' });
await page.getByText('START CONVERSATION').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: 'shot-chat.png' });

// Admin login + dashboard
const a = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await a.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await a.waitForTimeout(900);
await a.screenshot({ path: 'shot-admin-login.png' });
await a.fill('input[type=email]', 'admin@gmail.com');
await a.fill('input[type=password]', 'admin@123!');
await a.keyboard.press('Enter');
await a.waitForTimeout(4000);
await a.screenshot({ path: 'shot-admin-dash.png' });

await browser.close();
console.log('done');
