import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  // Keep this data-flow test independent of the GPU and real production counts.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
      if (kind === 'webgl' || kind === 'webgl2') return null;
      return original.call(this, kind, ...args);
    };
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let total=40, acknowledge=false, reads=0;
  const events=new Set(), requests=[];
  await page.route('**/api/diyas',async route=>{
    if(route.request().method()==='GET') {
      reads++;
      return route.fulfill({json:{count:total}});
    }
    const {eventId}=route.request().postDataJSON();
    requests.push(eventId);
    if(!events.has(eventId)){events.add(eventId);total++;}
    // Simulate a committed increment whose response was lost.
    await route.fulfill(acknowledge?{json:{count:total}}:{status:503,json:{error:'Connection interrupted'}});
  });
  await page.goto('http://localhost:3000');
  await page.getByLabel('Before we begin').fill('Ananya');
  await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();
  await page.getByRole('button',{name:'Light the diya',exact:true}).click();
  await page.getByRole('button',{name:/CONTINUE TO THE MAGIC/}).click();
  await page.getByText('Your light is shining. We’re still adding it to the global count.').waitFor();
  await page.getByRole('button',{name:/Reconnect your light/}).waitFor();
  assert.ok(reads>=1,'GET can succeed while submission remains pending');
  await page.waitForFunction(()=>document.querySelector('.counter strong')?.textContent==='41');
  const initialRequests=requests.length;
  await page.waitForTimeout(2300);
  assert.ok(requests.length>initialRequests,'automatically retries failed acknowledgements');
  acknowledge=true;
  await page.getByRole('button',{name:/Reconnect your light/}).click();
  await page.getByText('Together, we’re spreading light and happiness!').waitFor();
  assert.equal(events.size,1);
  assert.equal(total,41);
  assert.equal(new Set(requests).size,1,'all retries reuse one event UUID');
  assert.equal(await page.getByRole('button',{name:/Reconnect your light/}).count(),0);
  // A stale read cannot roll the UI counter backwards.
  total=40;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.counter strong').textContent(),'41');
  const confirmedRequests=requests.length;
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{}}));
  await page.getByRole('button',{name:/SHARE THE HAPPINESS/}).click();
  assert.equal(requests.length,confirmedRequests,'sharing never submits another event');
  assert.deepEqual(errors,[]);
  console.log('PASS: failed acknowledgement remains pending despite a successful GET; automatic/manual retries reuse the original event; one increment; stale-read protection; sharing never increments.');
} finally {
  await browser.close();
}
