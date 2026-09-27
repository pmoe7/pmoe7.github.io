const { chromium } = require(process.env.USERPROFILE + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const server=http.createServer((req,res)=>{const file=path.join(process.cwd(),new URL(req.url,'http://localhost').pathname); const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.JPG':'image/jpeg'}[path.extname(file)];if(type)res.setHeader('Content-Type',type);fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.end(err?'Missing':data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 for(const [width,theme] of [[1440,'light'],[393,'light'],[393,'dark']]){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:theme});
  await page.route('https://**/*',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/projects.html`,{waitUntil:'networkidle'});
  await page.screenshot({path:`tmp/fresh-${width}-${theme}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('main article').first().locator('h3').textContent(),'AkerAI');
  assert.equal(await page.locator('.work-card time').count(),6);
  assert.equal(await page.locator('.work-current img').first().evaluate(i=>i.complete&&i.naturalWidth>0),true);
  await page.locator('.work-current [data-gallery-open]').click();
  assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);
  await page.locator('[data-preview-next]').click();
  assert.match(await page.locator('#preview-caption').textContent(),/Analytics/);
  await page.keyboard.press('Escape');
  await page.locator('[data-project-filter="research"]').click();
  assert.equal(await page.locator('[data-project-count]').textContent(),'3 projects');
  assert.equal(await page.locator('#current-chapter').isVisible(),true);
  await page.locator('[data-project-filter="all"]').click();
  await page.screenshot({path:`tmp/projects-${width}-${theme}.png`,fullPage:true});
  console.log(`${width}px ${theme}: layout, dates, images, gallery, filters passed`);
  await page.close();
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
