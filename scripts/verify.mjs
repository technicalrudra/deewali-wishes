import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{
 for(const [width,height] of (process.env.VERIFY_ADVANCED_ONLY?[]:[[390,844],[360,800],[375,812],[412,915],[1440,1000]])){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Isolate browser checks from the live global total.
  await page.route('**/api/diyas',route=>route.fulfill({json:{count:route.request().method()==='POST'?11:10}}));
  await page.goto('http://localhost:3000');await page.getByRole('heading',{name:/Something magical/}).waitFor();await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`horizontal overflow ${width}`);
  if(width===390||width===1440)await page.screenshot({path:`artifacts/welcome-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();await page.locator('#name-error').waitFor();
  await page.getByLabel('Before we begin').fill('Ananya');await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();
  const next=page.getByRole('button',{name:/CONTINUE TO THE MAGIC/});await next.waitFor();assert.equal(await next.isDisabled(),true);
  assert.equal(await page.locator('.experience').evaluate(e=>e.classList.contains('is-lit')),false);
  if(width===390)await page.screenshot({path:'artifacts/unlit-390.png',fullPage:true});
  let writes=0;page.on('request',r=>{if(r.url().includes('/api/diyas')&&r.method()==='POST')writes++;});
  const lightingResponse=page.waitForResponse(r=>r.url().includes('/api/diyas')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Light the diya',exact:true}).click();await page.getByRole('button',{name:'Diya is lit'}).waitFor();assert.equal(await next.isEnabled(),true);await page.waitForTimeout(1500);
  assert.equal(writes,1,'one increment request per light');assert.equal((await lightingResponse).status(),200);
  if(width===390)await page.screenshot({path:'artifacts/lit-390.png',fullPage:true});
  await next.click();await page.getByRole('heading',{name:/Happy Diwali, Ananya/}).waitFor();
  await page.getByText('Together, we’re spreading light and happiness!').waitFor();
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});});
  await page.getByRole('button',{name:/SHARE THE HAPPINESS/}).click();await page.getByRole('button',{name:'LINK COPIED'}).waitFor();
  const clip=await page.evaluate(()=>navigator.clipboard.readText());assert.match(clip,/Ananya/);assert.match(clip,/http:\/\/localhost:3000/);assert.equal(writes,1,'sharing must never increment');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===390)await page.screenshot({path:'artifacts/celebration-390.png',fullPage:true});
  const bounds=await page.getByRole('button',{name:'LINK COPIED'}).boundingBox();assert.ok(bounds.y+bounds.height<height,'primary action inside viewport');
  console.log(`PASS ${width}x${height}: validation, unlit gate, lighting, one write, greeting, clipboard, viewport`);
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});await page.goto('http://localhost:3000');await page.getByRole('heading',{name:/Something magical/}).waitFor();assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);await page.close();
 const apiPage=await browser.newPage();await apiPage.goto('http://localhost:3000');
 const invalid=await apiPage.request.post('http://localhost:3000/api/diyas',{data:{eventId:'invalid'}});assert.equal(invalid.status(),400);
 const foreign=await apiPage.request.post('http://localhost:3000/api/diyas',{headers:{origin:'https://foreign.example'},data:{eventId:'invalid'}});assert.equal(foreign.status(),403);
 await apiPage.route('**/api/diyas',route=>route.fulfill({json:{count:11}}));
 await apiPage.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async(data)=>{window.__shared=data;}});});
 await apiPage.reload();await apiPage.getByLabel('Before we begin').fill('दीपक');await apiPage.getByRole('button',{name:/LET’S CELEBRATE/}).click();await apiPage.getByRole('button',{name:'Light the diya',exact:true}).click();await apiPage.getByRole('button',{name:/CONTINUE TO THE MAGIC/}).click();await apiPage.getByRole('button',{name:/SHARE THE HAPPINESS/}).click();
 const nativeShare=await apiPage.evaluate(()=>window.__shared);assert.match(nativeShare.text,/दीपक/);assert.equal(nativeShare.url,'http://localhost:3000/');await apiPage.close();
 console.log('PASS API validation, cross-origin protection, international name, native share payload');
 const fallback=await browser.newPage({viewport:{width:375,height:812}});await fallback.route('**/api/diyas',route=>route.fulfill({json:{count:11}}));await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl2'||kind==='webgl')return null;return original.call(this,kind,...args);};});await fallback.goto('http://localhost:3000');await fallback.locator('.fallback-diya.lit').waitFor();await fallback.getByLabel('Before we begin').fill('Priya');await fallback.getByRole('button',{name:/LET’S CELEBRATE/}).click();await fallback.locator('.fallback-diya:not(.lit)').waitFor();await fallback.getByRole('button',{name:'Light the diya',exact:true}).click();await fallback.locator('.fallback-diya.lit').waitFor();await fallback.close();
 console.log('PASS WebGL fallback starts unlit and lights on interaction');
 assert.deepEqual(errors,[],'browser runtime errors');
 console.log('PASS reduced motion and no browser runtime errors');
}finally{await browser.close();}
