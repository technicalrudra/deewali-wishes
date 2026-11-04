import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

// Explicit live check: lights ONE real diya via the UI, then retries that same event.
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
      if (kind === 'webgl' || kind === 'webgl2') return null;
      return original.call(this, kind, ...args);
    };
  });
  const beforeResponse = await context.request.get('http://localhost:3000/api/diyas');
  assert.equal(beforeResponse.status(), 200, 'Live API must load the global count');
  const before = (await beforeResponse.json()).count;
  await page.goto('http://localhost:3000');
  await page.getByLabel('Before we begin').fill('Diwali');
  await page.getByRole('button', { name: /LET’S CELEBRATE/ }).click();
  const next = page.getByRole('button', { name: /CONTINUE TO THE MAGIC/ });
  await next.waitFor();
  assert.equal(await next.isDisabled(), true);
  const lightingResponse = page.waitForResponse(response => response.url().includes('/api/diyas') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Light the diya', exact: true }).click();
  const response = await lightingResponse;
  assert.equal(response.status(), 200, 'Live lighting must succeed');
  const after = (await response.json()).count;
  assert.equal(after, before + 1, 'One real lighting increments once');
  const event = response.request().postDataJSON();
  const retries = await Promise.all(Array.from({ length: 3 }, () => context.request.post('http://localhost:3000/api/diyas', { data: event })));
  for (const retry of retries) {
    assert.equal(retry.status(), 200);
    assert.equal((await retry.json()).count, after, 'Concurrent retries must not add another light');
  }
  await next.click();
  await page.getByText('Together, we’re spreading light and happiness!').waitFor();
  assert.equal(await page.locator('.counter strong').textContent(), after.toLocaleString());
  assert.equal(await page.getByRole('button', { name: /Reconnect your light/ }).count(), 0);
  const otherVisitor = await browser.newContext();
  const globalResponse = await otherVisitor.request.get('http://localhost:3000/api/diyas');
  assert.equal((await globalResponse.json()).count, after, 'A second visitor reads the same global total');
  await otherVisitor.close();
  console.log(`PASS: live count ${before} → ${after}; three concurrent retries added zero; celebration displays the saved count; another visitor sees the same total.`);
} finally {
  await browser.close();
}
