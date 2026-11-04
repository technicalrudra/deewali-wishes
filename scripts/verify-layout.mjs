import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
const failures=[];
try {
  for(const [width,height] of [[390,844],[360,800],[375,667],[360,640],[412,915],[1440,900]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl'||kind==='webgl2')return null;return original.call(this,kind,...args);};});
    await page.route('**/api/diyas',route=>route.fulfill({json:{count:10}}));
    await page.goto('http://localhost:3000');
    async function check(step){
      const dimensions=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));
      if(dimensions.height>height+1||dimensions.width>width) failures.push({width,height,step,...dimensions});
      console.log(`${width}x${height} ${step}: content ${dimensions.width}x${dimensions.height}`);
    }
    await page.getByLabel('Before we begin').waitFor();await check('welcome');
    await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();await page.locator('#name-error').waitFor();await check('validation');
    await page.getByLabel('Before we begin').fill('Ananya');
    await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();
    await page.getByRole('button',{name:'Light the diya',exact:true}).waitFor();await check('lighting');
    await page.getByRole('button',{name:'Light the diya',exact:true}).click();
    await page.getByRole('button',{name:/CONTINUE TO THE MAGIC/}).click();
    await page.getByRole('button',{name:'LIGHT UP THE FIREWORKS',exact:true}).waitFor();await check('celebration');
    // Resize the same loaded page: no reload or device-height cache is required.
    await page.setViewportSize({width,height:height+50});await page.waitForTimeout(100);
    assert.equal(await page.locator('.experience').evaluate(el=>Math.round(el.getBoundingClientRect().height)),height+50);
    await page.close();
  }
  assert.deepEqual(failures,[],'All normal layouts fit without scrolling');
} finally {await browser.close();}
