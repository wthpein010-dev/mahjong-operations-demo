// Run after build-pages-demo.cjs. Requires Playwright (or PLAYWRIGHT_MODULE).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
assert(fs.existsSync(path.join(root,'demo/index.html')),'A standalone Pages demo must be built');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const seed=JSON.parse(fs.readFileSync(path.join(root,'public/reference/seed.json'),'utf8'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.sql':'text/plain'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const rejected=async(page,input)=>page.evaluate(async input=>{
 try {await PagesDemoDatabase.request(input);return null;}catch(e){return {status:e.status,code:e.code,message:e.message};}
},input);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
 const context=await browser.newContext();const errors=[],remote=[];
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){remote.push(route.request().url());return route.abort();}return route.continue();});
 async function open(ctx=context){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/demo/?page=reference');await p.waitForFunction(()=>databaseState.ready);return p;}
 try{
  const a=await open();
  assert.equal(await a.evaluate(()=>Object.keys(db).length),19,'Load every seed key');
  assert.deepEqual(await a.evaluate(()=>db),seed,'The public JSON is the complete authoritative baseline');
  assert.match(await a.locator('body').innerText(),/GitHub备用演示/);
  assert.match(await a.locator('body').innerText(),/不是 D1 云端/);
  assert.equal(await a.locator('input[type=password]').count(),0);
  const status=await a.evaluate(()=>PagesDemoDatabase.status());assert.equal(status.available,true);assert.equal(status.storage,'IndexedDB');assert.equal(status.tables.rooms,360);assert.equal(status.tables.charges,240);
  const links=await a.locator('.reference-downloads a').evaluateAll(as=>as.map(a=>a.href));assert.equal(links.length,6);
  for(const link of links){assert(link.startsWith(base+'/public/reference/'));assert.equal((await context.request.get(link)).status(),200);}
  const b=await open();const stale=await b.evaluate(()=>({revision:databaseState.revision,sessionId:databaseState.sessionId}));
  await a.evaluate(()=>{db.config.responseHours=17;queueDatabaseSave();});await a.waitForFunction(()=>databaseState.phase==='saved');
  const saved=await a.evaluate(()=>databaseState.revision);assert.equal(saved,1);
  assert.equal(await a.evaluate(()=>databaseState.status.revision),1,'Status reflects committed save without manual refresh');
  await a.reload();await a.waitForFunction(()=>databaseState.ready);assert.equal(await a.evaluate(()=>db.config.responseHours),17,'Refresh preserves committed state');
  await b.evaluate(()=>{db.config.responseHours=19;queueDatabaseSave();});await b.waitForFunction(()=>databaseState.phase==='conflict');assert.equal(await b.evaluate(()=>databaseWritable()),false,'Stale tab pauses');
  assert.equal((await rejected(b,{method:'POST',...stale,data:seed})).status,409);
  await b.evaluate(()=>reloadDatabase());await b.waitForFunction(()=>databaseState.ready);assert.equal(await b.evaluate(()=>db.config.responseHours),17,'Explicit reload recovers without stale overwrite');
  const current=await b.evaluate(()=>({revision:databaseState.revision,sessionId:databaseState.sessionId}));
  for(const key of ['players','charges','rooms','transfers']){
   const data=structuredClone(seed);data[key][0].status='forbidden';
   const error=await rejected(b,{method:'POST',...current,data});assert.equal(error.status,403,key+' must stay read only');assert.equal(error.code,'READONLY_SOURCE');
  }
  const beforeReset=await a.evaluate(()=>({revision:databaseState.revision,sessionId:databaseState.sessionId}));
  await b.evaluate(()=>resetDatabase());await b.waitForFunction(()=>databaseState.ready&&databaseState.phase==='ready');
  assert.equal(await b.evaluate(()=>databaseState.revision),2,'Reset increments revision');assert.deepEqual(await b.evaluate(()=>db),seed);
  assert.equal(await b.evaluate(()=>databaseState.status.revision),2,'Status reflects reset without manual refresh');
  assert.notEqual(await b.evaluate(()=>databaseState.sessionId),beforeReset.sessionId,'Reset rotates the browser sandbox session');
  assert.equal((await rejected(a,{method:'POST',...beforeReset,data:seed})).status,409,'Reset rejects old tabs');
  await a.evaluate(()=>reloadDatabase());await a.waitForFunction(()=>databaseState.ready);
  await a.evaluate(()=>{const old=IDBObjectStore.prototype.put;window.restorePut=()=>IDBObjectStore.prototype.put=old;IDBObjectStore.prototype.put=function(){throw new DOMException('test full storage','QuotaExceededError');};db.config.responseHours=22;queueDatabaseSave();});
  await a.waitForFunction(()=>databaseState.phase==='failure');assert.equal(await a.evaluate(()=>databaseWritable()),false);assert.notEqual(await a.evaluate(()=>databaseState.phase),'saved');
  await a.evaluate(()=>{restorePut();return reloadDatabase();});await a.waitForFunction(()=>databaseState.ready);assert.equal(await a.evaluate(()=>db.config.responseHours),24,'Failed transaction did not persist or report success');
  await a.evaluate(()=>{const old=IDBObjectStore.prototype.put;window.restoreAbortPut=()=>IDBObjectStore.prototype.put=old;IDBObjectStore.prototype.put=function(){const req=old.apply(this,arguments),tx=this.transaction;queueMicrotask(()=>tx.abort());return req;};db.config.responseHours=23;queueDatabaseSave();});
  await a.waitForFunction(()=>databaseState.phase==='failure');assert.equal(await a.evaluate(()=>databaseWritable()),false,'Transaction abort pauses further writes');
  await a.evaluate(()=>{restoreAbortPut();return reloadDatabase();});await a.waitForFunction(()=>databaseState.ready);assert.equal(await a.evaluate(()=>db.config.responseHours),24,'Aborted transaction did not persist');assert.equal(await a.evaluate(()=>databaseState.revision),2);
  const count=await a.evaluate(()=>{let n=0;for(const r of ['hq','service','regional','local']){role=r;account=r==='regional'?'M0':r==='local'?'S1':'HQ';selected=[];for(const p of Object.keys(labels)){if(permitted(p)){page=p;render();if(!document.querySelector('#main').textContent.trim())throw Error('Empty '+r+'/'+p);n++;}}}return n;});assert(count>70,'Exercise all permitted role/page combinations');
  assert.equal((await a.evaluate(()=>action('transfer','A0'))),undefined,'No transfer execution entry');
  const concurrentEnvelope=await a.evaluate(()=>PagesDemoDatabase.request());
  const concurrentInputs=[17,19].map(responseHours=>({method:'POST',revision:concurrentEnvelope.revision,sessionId:concurrentEnvelope.sessionId,data:{...structuredClone(seed),config:{...seed.config,responseHours}}}));
  const concurrent=await Promise.all([a,b].map((p,i)=>p.evaluate(async input=>{try{return {ok:true,value:await PagesDemoDatabase.request(input)};}catch(e){return {ok:false,status:e.status};}},concurrentInputs[i])));
  assert.equal(concurrent.filter(r=>r.ok).length,1,'Exactly one simultaneous same-version write commits');assert.equal(concurrent.find(r=>!r.ok).status,409);
  const concurrentStored=await a.evaluate(()=>PagesDemoDatabase.request());assert.equal(concurrentStored.revision,3);assert([17,19].includes(concurrentStored.data.config.responseHours));
  assert.deepEqual(errors,[],'Full UI bundle has no page errors');assert.deepEqual(remote,[],'Standalone demo requests no external origin');
  const isolated=await browser.newContext();const [other,otherTab]=await Promise.all([open(isolated),open(isolated)]);assert.equal(await other.evaluate(()=>databaseState.revision),0,'Other browser context has its own local sandbox');assert.equal(await other.evaluate(()=>databaseState.sessionId),await otherTab.evaluate(()=>databaseState.sessionId),'Concurrent first loads initialize one shared local session');assert.equal((await other.evaluate(()=>PagesDemoDatabase.status())).snapshotRecords,2);await isolated.close();
  const broken=await browser.newContext();await broken.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('blocked storage','SecurityError');}});});const p=await broken.newPage();await p.goto(base+'/demo/');await p.waitForFunction(()=>databaseState.phase==='load-error');assert.equal(await p.evaluate(()=>databaseState.ready),false);assert.match(await p.locator('#main').innerText(),/IndexedDB/);assert(await p.locator('#main a[download]').count()>0,'Downloads remain available when local storage fails');await broken.close();
  console.log(`Pages demo: ${count} role/page views plus real IndexedDB baseline, refresh, conflict, recovery, readonly, transaction failure, reset and browser isolation passed.`);
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
