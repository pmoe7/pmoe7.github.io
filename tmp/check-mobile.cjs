const { chromium } = require(process.env.USERPROFILE + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const server = http.createServer((req,res) => {
 const file = path.join(root, decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 const type = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)];
 if (type) res.setHeader('Content-Type',type);
 fs.readFile(file,(err,data) => {res.statusCode=err?404:200;res.end(err?'Missing':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:"msedge"});
 try {
 for (const [width,height] of [[393,852],[320,568],[430,932],[760,600],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'no-preference'});
  await page.route('https://**/*', route => route.abort());
  await page.addInitScript(()=>sessionStorage.setItem('mp-intro-v2','1'));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?season=fall`,{waitUntil:'networkidle'});
  const metrics=await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   return {content:rect('.hero-link'),menu:rect('[data-menu-open]'),toolbar:rect('.topbar-actions'),footer:rect('.site-footer'),socials:rect('.footer-socials'),brand:rect('.footer-brand'),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  console.log(JSON.stringify({width,height,...metrics}));
  if(metrics.overflow || metrics.content.bottom>metrics.footer.y || metrics.socials.right>width || metrics.menu.right>metrics.toolbar.x) throw new Error('Layout collision');
  if(width===393) await page.screenshot({path:'tmp/mobile-home.png',fullPage:true});
  await page.close();
 }
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


