// Build a static, independently runnable backup from the shared frontend without changing public/.
// demo/local-database.js is maintained source; the other demo files are generated here.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'public'),out=path.join(root,'demo');
fs.mkdirSync(out,{recursive:true});
const marker='GitHub备用演示 · 浏览器本地数据库';
function replaceFunction(text,name,next,body){
 const start=text.indexOf('function '+name+'('),asyncStart=text.indexOf('async function '+name+'(');
 const begin=asyncStart>=0&&asyncStart===start-6?asyncStart:start;
 const end=text.indexOf(next,begin);
 if(begin<0||end<0)throw new Error('Frontend boundary changed: '+name);
 return text.slice(0,begin)+body+'\n'+text.slice(end);
}
for(const file of ['extensions.js','style.css'])fs.copyFileSync(path.join(source,file),path.join(out,file));
const app=fs.readFileSync(path.join(source,'app.js'),'utf8')
 .replace('公开开发参考应用已接入演示数据库。首次保存为当前浏览器建立独立沙盒；其他访客的修改不相互覆盖。','GitHub备用演示使用 IndexedDB 浏览器本地数据库。首次保存更新本站本地沙盒；同浏览器的标签页共享数据，其他浏览器和设备独立，不跨设备同步。')
 .replace('恢复当前演示沙盒的初始虚构数据，清除已保存的演示修改。其他访客的独立沙盒保持原状。','恢复本浏览器本站的初始虚构数据，清除已保存的演示修改。其他设备和浏览器不受影响；本浏览器其他旧标签页需重新加载。');
fs.writeFileSync(path.join(out,'app.js'),app);
let html=fs.readFileSync(path.join(source,'dashboard.html'),'utf8');
html=html.replace('<title>麻溜后台管理系统 · V1.7</title>','<title>雀序运营后台 · V1.7 GitHub备用演示</title>')
 .replace('正在连接演示数据库','正在读取 IndexedDB 本地数据库')
 .replace('<main id="main"></main>',`<section class="pages-local-banner" role="note"><strong>${marker}</strong><span>IndexedDB 修改仅保存在当前浏览器，不是 D1 云端，不跨设备同步。清理网站数据会删除修改。</span><a href="../reference.html">开发资料与运行方式</a></section><main id="main"></main>`)
 .replace('V1.7 · 2026-10-11 · 虚构数据 / 独立数据库沙盒','V1.7 备用版 · 虚构数据 / 浏览器本地沙盒')
 .replace('<script src="database.js?v=1.7"></script>','<script src="local-database.js?v=1.7"></script><script src="database.js?v=1.7"></script>');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.appendFileSync(path.join(out,'style.css'),'\n.pages-local-banner{margin:20px 28px 0;padding:15px 18px;border:1px solid #947347;background:#fff4d8;color:#493716;border-radius:8px;display:flex;flex-wrap:wrap;gap:8px 16px;line-height:1.65}.pages-local-banner strong{flex-basis:100%}.pages-local-banner span{flex:1}.pages-local-banner a{color:#493716;white-space:nowrap}.database-loading .reference-downloads{margin-top:18px}@media(max-width:760px){.pages-local-banner{margin:14px 12px 0;padding:12px;flex-direction:column;align-items:flex-start}.pages-local-banner strong{flex-basis:auto}.pages-local-banner span{flex:none}}\n');
let database=fs.readFileSync(path.join(source,'database.js'),'utf8');
database=replaceFunction(database,'databaseRequest','async function reloadDatabase',`async function databaseRequest(method,data){
 const result=await PagesDemoDatabase.request({method:method||'GET',data,revision:databaseState.revision,sessionId:databaseState.sessionId});
 try{databaseState.status=await PagesDemoDatabase.status();databaseState.statusPhase='ready';}
 catch{databaseState.status=null;databaseState.statusPhase='error';}
 return result;
}`);
database=replaceFunction(database,'loadReferenceStatus','function referenceDatabaseSummary',`async function loadReferenceStatus(){
 databaseState.statusPhase='loading';if(page==='reference'&&databaseState.ready)render();
 try{databaseState.status=await PagesDemoDatabase.status();databaseState.statusPhase='ready';}
 catch(error){databaseState.status=null;databaseState.statusPhase='error';}
 finally{if(page==='reference'&&databaseState.ready)render();}
}`);
database=replaceFunction(database,'referenceDatabaseSummary','function referencePage',`function referenceDatabaseSummary(){
 if(databaseState.statusPhase==='loading')return '<p role="status">正在检查 IndexedDB 本地存储与数据对象数量…</p>';
 if(databaseState.statusPhase==='error')return '<p role="alert">IndexedDB 本地存储暂时不可用，请刷新状态重试。SQL、JSON 与 OpenAPI 下载仍可使用。</p>';
 const s=databaseState.status;
 return '<div class="reference-facts"><div><small>实际存储</small><strong>IndexedDB · 浏览器本地</strong></div><div><small>存储可用</small><strong>'+(s.available?'可用':'不可用')+'</strong></div><div><small>实际快照记录</small><strong>'+s.snapshotRecords+'（基线与本地沙盒）</strong></div><div><small>本地版本</small><strong>'+s.revision+'</strong></div></div><div class="reference-counts">'+Object.entries(s.tables).map(([name,count])=>'<span><code>'+esc(name)+'</code><strong>'+esc(count)+'</strong></span>').join('')+'</div><p class="muted">以上为当前 IndexedDB 快照中的真实数据对象数量；config 显示配置项数量。公开虚构基线只读，本浏览器各标签页共享本地沙盒；不跨设备同步，不代表 D1 规范化表记录数。</p>';
}`);
database=replaceFunction(database,'renderDatabaseLoading','async function databaseRequest',`function renderDatabaseLoading(error=''){
 $('#role').disabled=true;$('#nav').innerHTML='';$('#main').setAttribute('aria-busy',String(!error));
 $('#storage-note').textContent=error?'IndexedDB 本地数据库读取失败':'正在读取 IndexedDB 本地数据库';
 $('#main').innerHTML='<section class="panel policy database-loading" role="'+(error?'alert':'status')+'"><div class="eyebrow">V1.7 · GitHub备用演示</div><h1>'+(error?'IndexedDB 本地数据库暂时无法读取':'正在读取 IndexedDB 本地数据库')+'</h1><p>'+(error?esc(error)+'。修改未载入；请检查浏览器存储权限后重试。':'读取本站虚构基线与本浏览器保存的沙盒状态，完成后可体验后台操作。')+'</p>'+(error?'<button id="database-load-retry" class="primary">重试读取本地数据库</button>':'<p class="muted">正在读取浏览器本地存储，请稍候…</p>')+'<div class="reference-downloads"><a href="../public/reference/seed.json" download>虚构 JSON 数据</a><a href="../public/reference/sqlite-schema.sql" download>SQLite / D1 结构</a><a href="../public/reference/openapi.json" download>OpenAPI 接口需求</a><a href="../reference.html">全部开发资料</a></div></section>';
 $('#database-load-retry')?.addEventListener('click',reloadDatabase);
}`);
database=database.replace('公共虚构示例','本站虚构只读基线').replace('当前浏览器的独立演示沙盒','本浏览器本站的本地沙盒')
 .replaceAll('等待服务器确认','等待 IndexedDB 事务完成').replaceAll('服务器的新版本','本地数据库的新版本').replaceAll('读取服务器最新数据','读取本地数据库最新数据')
 .replaceAll('演示数据库','IndexedDB 本地数据库').replace('虚构数据来自IndexedDB 本地数据库；修改存入独立沙盒。','修改仅存本浏览器 IndexedDB；不跨设备同步。')
 .replace('首次保存将建立独立演示沙盒。','首次保存将更新本地沙盒。')
 .replace('当前演示数据已恢复；其他访客的沙盒不受影响','本浏览器本站数据已恢复；其他设备或浏览器不受影响，旧标签页需重新加载')
 .replace('reloadDatabase();\nloadReferenceStatus();','reloadDatabase();')
 .replace('href="/reference/${file}"','href="../public/reference/${file}"')
 .replace('公开演示状态 API 已连接数据库；OpenAPI 中的业务接口是对接需求，尚未连接真实游戏、账户和支付系统。','此备用入口使用浏览器 IndexedDB 本地数据库；已实现的演示 API 仅在 Sites 云端运行，本入口不调用这些 API。OpenAPI 中的业务接口是待接入需求，尚未连接真实游戏、账户和支付系统。');
if(database.includes("fetch('/api/")||database.includes('chatgpt.site'))throw new Error('Static demo must not depend on cloud APIs');
fs.writeFileSync(path.join(out,'database.js'),database);
if(!fs.existsSync(path.join(out,'local-database.js')))throw new Error('Missing maintained local IndexedDB transport');
console.log('Built V1.7 standalone GitHub Pages demo from public/; shared source unchanged.');
