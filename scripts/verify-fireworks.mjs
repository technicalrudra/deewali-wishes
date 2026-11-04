import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors = [];
try {
  for (const [width,height,reduced] of [[390,844,false],[360,800,false],[375,812,false],[412,915,false],[390,844,true]]) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',permissions:['clipboard-read','clipboard-write']});
    const page = await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',message=>{if(message.type()==='error'&&/shader|THREE.WebGLProgram/.test(message.text()))errors.push(message.text());});
    // Only the first run needs real WebGL. Counter traffic is always isolated from production.
    if(width!==390||reduced)await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl'||kind==='webgl2')return null;return original.call(this,kind,...args);};});
    let posts=0;
    await page.route('**/api/diyas',route=>{if(route.request().method()==='POST')posts++;return route.fulfill({json:{count:10}});});
    await page.goto('http://localhost:3000');
    await page.getByLabel('Before we begin').fill('Ananya');
    await page.getByRole('button',{name:/LET’S CELEBRATE/}).click();
    await page.getByRole('button',{name:'Light the diya',exact:true}).click();
    await page.getByRole('button',{name:/CONTINUE TO THE MAGIC/}).click();
    const trigger=page.getByRole('button',{name:'LIGHT UP THE FIREWORKS',exact:true});
    await trigger.waitFor();
    await page.getByText('Together, we’re spreading light and happiness!').waitFor();
    assert.equal(await page.locator('[data-fireworks]').count(),0,'No automatic fireworks');
    const share=page.getByRole('button',{name:'SHARE THE HAPPINESS',exact:true});
    const buttonBox=await trigger.boundingBox(),shareBox=await share.boundingBox(),counterBox=await page.locator('.counter').boundingBox();
    assert.ok(buttonBox.y<shareBox.y&&shareBox.y<counterBox.y,'Required button and counter hierarchy');
    assert.equal(buttonBox.width,shareBox.width,'Buttons have equal width');
    assert.ok(counterBox.y+counterBox.height<=height,'Counter fits viewport');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'No unnecessary vertical scroll');
    if(width===390&&!reduced)await page.screenshot({path:'artifacts/final-fireworks-idle-390.png',fullPage:true});
    await trigger.click();
    const celebrating=page.getByRole('button',{name:/CELEBRATING!/});
    assert.equal(await celebrating.isDisabled(),true);
    await page.locator('[data-fireworks="playing"]').waitFor();
    assert.equal(await page.locator('.experience.is-lit').count(),1,'Diya stays lit');
    assert.equal(await share.isEnabled(),true,'Sharing remains independent');
    if(width===390&&!reduced){
      await page.locator('.fireworks-layer canvas').waitFor();
      await page.waitForTimeout(1900);
      await page.screenshot({path:'artifacts/final-fireworks-playing-390.png',fullPage:true});
      await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}));
      await share.click();
      await page.getByRole('button',{name:'LINK COPIED'}).waitFor();
      const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
      assert.match(clipboard,/Ananya/);
      await trigger.waitFor({timeout:15000});
      assert.equal(await page.locator('[data-fireworks]').count(),0);
      await trigger.click();
      await celebrating.waitFor();
      await trigger.waitFor({timeout:15000});
      console.log('PASS real Three.js sequence, completion, replay, clipboard sharing during fireworks');
    }
    if(reduced){await page.locator('.quiet-fireworks').waitFor();await trigger.waitFor({timeout:5000});console.log('PASS reduced-motion quiet celebration and reset');}
    assert.equal(posts,1,'Fireworks and sharing never increment the counter');
    assert.equal(await page.locator('.counter strong').textContent(),'10');
    console.log(`PASS ${width}x${height}${reduced?' reduced motion':''}: layout, no autoplay, hierarchy, independent controls, one lighting request`);
    await context.close();
  }
  assert.deepEqual(errors,[],'No browser or shader errors');
} finally {await browser.close();}
