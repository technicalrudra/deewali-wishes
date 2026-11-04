import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const device of ['iPhone 13', 'Pixel 7']) {
    const context = await browser.newContext({ ...devices[device], reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      // Older/in-app browsers and LAN HTTP previews lack these convenience APIs.
      Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
      Object.defineProperty(AbortSignal, 'timeout', { configurable: true, value: undefined });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
        if (kind === 'webgl' || kind === 'webgl2') return null;
        return original.call(this, kind, ...args);
      };
    });
    const initial = await context.request.get('http://localhost:3000/api/diyas');
    assert.equal(initial.status(), 200);
    const actualCount = (await initial.json()).count;
    let posts = 0;
    await page.route('**/api/diyas', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      posts++;
      const { eventId } = route.request().postDataJSON();
      assert.match(eventId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      // Preserve the live total: UI testing must not create test lights.
      return route.fulfill({ json: { count: actualCount } });
    });
    await page.goto('http://localhost:3000');
    await page.getByLabel('Before we begin').fill('Ananya');
    await page.getByRole('button', { name: /LET’S CELEBRATE/ }).click();
    await page.getByRole('button', { name: 'Light the diya', exact: true }).click();
    await page.getByRole('button', { name: /CONTINUE TO THE MAGIC/ }).click();
    await page.getByText('Together, we’re spreading light and happiness!').waitFor();
    assert.equal(await page.locator('.counter strong').textContent(), actualCount.toLocaleString());
    const box = await page.locator('.counter').boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= page.viewportSize().height, 'Counter stays visible');
    assert.equal(posts, 1);
    assert.deepEqual(errors, []);
    console.log(`PASS ${device}: live total ${actualCount} visible; lighting works without randomUUID or AbortSignal.timeout; one submission; no runtime errors.`);
    await context.close();
  }
} finally { await browser.close(); }
