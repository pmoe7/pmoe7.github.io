const { chromium } = require(process.env.USERPROFILE + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
(async () => {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
  await page.goto('https://aker-ai.com/',{waitUntil:'networkidle'});
  await page.locator('[class$="__amPreview"]').screenshot({path:'img/projects/akerai-dashboard.png'});
  await page.locator('#products').screenshot({path:'img/projects/akerai-products.png'});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
