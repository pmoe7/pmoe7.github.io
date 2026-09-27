const {chromium}=require(process.env.USERPROFILE+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const pages=['index.html','about.html','projects.html','writing.html','covid.html','law.html','pairs.html','contact.html','resume.html','404.html','Hackathon.html'];
const server=http.createServer((req,res)=>{const file=path.join(process.cwd(),new URL(req.url,'http://localhost').pathname);const type={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png'}[path.extname(file)];if(type)res.setHeader('Content-Type',type);fs.readFile(file,(e,d)=>{res.statusCode=e?404:200;res.end(e?'Missing':d);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 for(const width of [393,1440]) for(const colorScheme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width,height:852},colorScheme,reducedMotion:'reduce'});
 await context.route('https://**/*',r=>r.abort());
 await context.addInitScript(()=>{sessionStorage.setItem('mp-intro-v2','1');sessionStorage.setItem('mp-about-intro-v1','1');});
 const page=await context.newPage();let baseline;
 for(const name of pages){
  await page.goto(`http://127.0.0.1:${server.address().port}/${name}`,{waitUntil:'load'});
  const actual=await page.evaluate(()=>{
   const button=s=>{const el=document.querySelector(s),c=getComputedStyle(el),r=el.getBoundingClientRect();return {height:r.height,top:r.top,border:c.border,color:c.color,background:c.backgroundColor,radius:c.borderRadius};};
   const menu=document.querySelector('[data-menu-open]').getBoundingClientRect(),actions=document.querySelector('.topbar-actions').getBoundingClientRect();
   return {menu:button('[data-menu-open]'),actions:button('.topbar-actions'),left:menu.left,right:innerWidth-actions.right};
  });
  if(!baseline)baseline=actual;else assert.deepEqual(actual,baseline,`${name} ${width} ${colorScheme}`);
  if(name!=='index.html') assert.equal(await page.locator('.topbar-actions').evaluate(e=>e.getBoundingClientRect().width),50);
 }
 console.log(`Matching headers: ${pages.length} pages, ${width}px, ${colorScheme}`);await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
