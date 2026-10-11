// Database transport for the public reference application. Demo identities are not authentication.
const databaseState={phase:'loading',ready:false,revision:null,mode:null,sessionId:null,queue:[],busy:false,error:'',errorCode:'',lastSaved:null,status:null,statusPhase:'loading',failedOperation:''};
let referenceEntity='agents';
const stateArrays=['regions','managers','services','agents','tea','players','charges','rooms','transfers','logs','tickets','announcements','messages','tasks','read','ack','access'];

function stateShape(data){return data&&typeof data==='object'&&stateArrays.every(k=>Array.isArray(data[k]))&&data.config&&typeof data.config==='object'&&!Array.isArray(data.config);}
function databaseWritable(){return databaseState.ready&&!['failure','conflict','resetting','loading','load-error'].includes(databaseState.phase);}
function databaseMessage(){
 const modes={reference:'本站虚构只读基线',sandbox:'本浏览器本站的本地沙盒'};
 const state=databaseState;
 if(state.phase==='saving')return '数据库保存中 · 当前修改等待 IndexedDB 事务完成，请勿关闭页面。';
 if(state.phase==='failure')return state.failedOperation==='reset'?'恢复结果尚未确认 · '+state.error+'。请重试恢复或重新加载核对数据库。':'保存结果尚未确认 · '+state.error+'。当前修改仅在此页面内存中，暂停后续修改。';
 if(state.phase==='conflict')return ['SESSION_CONFLICT','SESSION_REQUIRED'].includes(state.errorCode)?'当前浏览器的演示会话已变化 · 本页面没有覆盖其他会话的数据。请重新加载数据库后再操作。':'数据库版本已变化 · 当前修改没有覆盖本地数据库的新版本。请重新加载最新数据后再操作。';
 if(state.phase==='resetting')return '正在恢复当前演示沙盒的初始数据，请稍候。';
 if(state.phase==='saved')return '已保存到IndexedDB 本地数据库 · '+modes[state.mode]+' · 版本 '+state.revision;
 return '已从IndexedDB 本地数据库读取 · '+modes[state.mode]+' · '+(state.mode==='sandbox'?'后续修改保存至该沙盒。':'首次保存将更新本地沙盒。');
}
function databaseNotice(){
 const problem=['failure','conflict'].includes(databaseState.phase);
 return `<section id="database-status" class="database-status ${problem?'problem':''}" role="status" aria-live="polite"><div><strong>IndexedDB 本地数据库</strong><span id="database-status-text">${esc(databaseMessage())}</span><small>角色切换仅演示页面权限；没有生产鉴权。真实游戏、支付与开户接口尚未接入。勿填写真实资料。</small></div><div class="database-actions">${databaseState.phase==='failure'?`<button id="database-retry">${databaseState.failedOperation==='reset'?'重试恢复':'重试保存'}</button>`:''}${problem?'<button id="database-reload">重新加载数据库</button>':''}<a href="?page=reference&amp;v=1.7" data-database-reference>开发参考</a></div></section>`;
}
function updateDatabaseNotice(){
 const existing=$('#database-status');
 if(existing){existing.outerHTML=databaseNotice();bindDatabaseControls();}
 const side=$('#storage-note');
 if(side)side.textContent=databaseState.ready?'修改仅存本浏览器 IndexedDB；不跨设备同步。':'正在连接IndexedDB 本地数据库';
 const entityStatus=$('#reference-database-summary');
 if(entityStatus)entityStatus.innerHTML=referenceDatabaseSummary();
}
function confirmDatabaseReload(form,dialog){dialog.close();reloadDatabase();}
function bindDatabaseControls(){
 $('#database-retry')?.addEventListener('click',retryDatabaseSave);
 $('#database-reload')?.addEventListener('click',()=>modal('重新加载数据库','<p>读取本地数据库最新数据，丢弃本页面中尚未确认保存的修改。已经保存的沙盒数据保留。</p>',confirmDatabaseReload,{recovery:'database-reload',confirmLabel:'重新加载数据库'}));
 $('[data-database-reference]')?.addEventListener('click',e=>{e.preventDefault();navigatePage('reference');});
 $('#reference-entity')?.addEventListener('change',e=>{referenceEntity=e.target.value;query='';offset=0;render();});
 $('#reference-refresh')?.addEventListener('click',()=>loadReferenceStatus());
}
function renderDatabaseLoading(error=''){
 $('#role').disabled=true;$('#nav').innerHTML='';$('#main').setAttribute('aria-busy',String(!error));
 $('#storage-note').textContent=error?'IndexedDB 本地数据库读取失败':'正在读取 IndexedDB 本地数据库';
 $('#main').innerHTML='<section class="panel policy database-loading" role="'+(error?'alert':'status')+'"><div class="eyebrow">V1.7 · GitHub备用演示</div><h1>'+(error?'IndexedDB 本地数据库暂时无法读取':'正在读取 IndexedDB 本地数据库')+'</h1><p>'+(error?esc(error)+'。修改未载入；请检查浏览器存储权限后重试。':'读取本站虚构基线与本浏览器保存的沙盒状态，完成后可体验后台操作。')+'</p>'+(error?'<button id="database-load-retry" class="primary">重试读取本地数据库</button>':'<p class="muted">正在读取浏览器本地存储，请稍候…</p>')+'<div class="reference-downloads"><a href="../public/reference/seed.json" download>虚构 JSON 数据</a><a href="../public/reference/sqlite-schema.sql" download>SQLite / D1 结构</a><a href="../public/reference/openapi.json" download>OpenAPI 接口需求</a><a href="../reference.html">全部开发资料</a></div></section>';
 $('#database-load-retry')?.addEventListener('click',reloadDatabase);
}
async function databaseRequest(method,data){
 const result=await PagesDemoDatabase.request({method:method||'GET',data,revision:databaseState.revision,sessionId:databaseState.sessionId});
 try{databaseState.status=await PagesDemoDatabase.status();databaseState.statusPhase='ready';}
 catch{databaseState.status=null;databaseState.statusPhase='error';}
 return result;
}
async function reloadDatabase(){
 if(databaseState.busy)return;
 databaseState.ready=false;databaseState.phase='loading';databaseState.error='';databaseState.errorCode='';
 renderDatabaseLoading();
 try{
  const result=await databaseRequest();
  if(!stateShape(result.data))throw new Error('返回的数据结构不完整');
  db=result.data;databaseState.revision=result.revision;databaseState.mode=result.mode;databaseState.sessionId=result.sessionId;databaseState.queue=[];databaseState.failedOperation='';databaseState.phase='ready';databaseState.ready=true;
  $('#role').disabled=false;$('#main').setAttribute('aria-busy','false');
  if(!databaseState.initialized){databaseState.initialized=true;loadURL();}else render();
  updateDatabaseNotice();
 }catch(error){databaseState.phase='load-error';databaseState.error=error.message;renderDatabaseLoading(error.message);}
}
function queueDatabaseSave(){
 if(!databaseWritable()){notify('数据库尚未就绪或存在未解决的保存问题，请先使用状态提示中的恢复操作');return;}
 databaseState.queue.push(structuredClone(db));databaseState.phase='saving';updateDatabaseNotice();
 drainDatabaseQueue();
}
async function drainDatabaseQueue(){
 if(databaseState.busy||databaseState.phase!=='saving')return;
 databaseState.busy=true;
 try{
  while(databaseState.queue.length&&databaseState.phase==='saving'){
   const snapshot=databaseState.queue.shift();
   try{
    const result=await databaseRequest('POST',snapshot);
    databaseState.revision=result.revision;databaseState.mode=result.mode;databaseState.sessionId=result.sessionId;databaseState.lastSaved=new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai'});
   }catch(error){
    databaseState.queue.unshift(snapshot);databaseState.failedOperation='save';databaseState.phase=[409,428].includes(error.status)?'conflict':'failure';databaseState.error=error.message;databaseState.errorCode=error.code||'';break;
   }
  }
  if(!databaseState.queue.length&&databaseState.phase==='saving'){databaseState.phase='saved';notify('修改已保存到IndexedDB 本地数据库');}
 }finally{databaseState.busy=false;updateDatabaseNotice();}
}
function retryDatabaseSave(){
 if(databaseState.phase!=='failure'||databaseState.busy)return;
 if(databaseState.failedOperation==='reset'){databaseState.phase='ready';resetDatabase();return;}
 databaseState.phase='saving';databaseState.error='';updateDatabaseNotice();drainDatabaseQueue();
}
async function resetDatabase(){
 if(!databaseWritable()||databaseState.busy||databaseState.queue.length){notify('请等待当前保存完成，再恢复演示数据');return;}
 databaseState.phase='resetting';databaseState.busy=true;updateDatabaseNotice();$('#role').disabled=true;
 try{
  const result=await databaseRequest('DELETE');
  databaseState.revision=result.revision;databaseState.mode=result.mode;databaseState.sessionId=result.sessionId;
  databaseState.phase='ready';databaseState.busy=false;await reloadDatabase();
  if(databaseState.ready){selected=[];render();notify('本浏览器本站数据已恢复；其他设备或浏览器不受影响，旧标签页需重新加载');}
 }catch(error){databaseState.failedOperation='reset';databaseState.phase=[409,428].includes(error.status)?'conflict':'failure';databaseState.error=error.message;databaseState.errorCode=error.code||'';updateDatabaseNotice();}
 finally{databaseState.busy=false;$('#role').disabled=!databaseState.ready;}
}
async function loadReferenceStatus(){
 databaseState.statusPhase='loading';if(page==='reference'&&databaseState.ready)render();
 try{databaseState.status=await PagesDemoDatabase.status();databaseState.statusPhase='ready';}
 catch(error){databaseState.status=null;databaseState.statusPhase='error';}
 finally{if(page==='reference'&&databaseState.ready)render();}
}
function referenceDatabaseSummary(){
 if(databaseState.statusPhase==='loading')return '<p role="status">正在检查 IndexedDB 本地存储与数据对象数量…</p>';
 if(databaseState.statusPhase==='error')return '<p role="alert">IndexedDB 本地存储暂时不可用，请刷新状态重试。SQL、JSON 与 OpenAPI 下载仍可使用。</p>';
 const s=databaseState.status;
 return '<div class="reference-facts"><div><small>实际存储</small><strong>IndexedDB · 浏览器本地</strong></div><div><small>存储可用</small><strong>'+(s.available?'可用':'不可用')+'</strong></div><div><small>实际快照记录</small><strong>'+s.snapshotRecords+'（基线与本地沙盒）</strong></div><div><small>本地版本</small><strong>'+s.revision+'</strong></div></div><div class="reference-counts">'+Object.entries(s.tables).map(([name,count])=>'<span><code>'+esc(name)+'</code><strong>'+esc(count)+'</strong></span>').join('')+'</div><p class="muted">以上为当前 IndexedDB 快照中的真实数据对象数量；config 显示配置项数量。公开虚构基线只读，本浏览器各标签页共享本地沙盒；不跨设备同步，不代表 D1 规范化表记录数。</p>';
}
function referencePage(){
 const downloads=[['SQLite / D1 结构','sqlite-schema.sql'],['SQLite / D1 示例数据','sqlite-seed.sql'],['MySQL 8 结构','mysql-schema.sql'],['MySQL 8 示例数据','mysql-seed.sql'],['完整虚构数据 JSON','seed.json'],['OpenAPI 3 接口清单','openapi.json']];
 const entityNames={agents:'普通代理',regions:'区域',managers:'地区负责人',services:'客服',tea:'茶馆',players:'玩家',charges:'充值及退款',rooms:'房间对局',tickets:'服务工单'};
 const fields={agents:['id','name','region','service','company','status'],regions:['id','name','wechat','status'],managers:['id','name','regions','status'],services:['id','name','type','region','rate','status'],tea:['id','name','agent','region','status'],players:['id','name','tea','status'],charges:['id','date','agent','region','amount','refunded'],rooms:['id','date','agent','region','tea','status'],tickets:['id','title','region','owner','status']};
 const names={id:'编号',name:'名称',region:'区域',regions:'授权区域',service:'服务客服',company:'归公司',status:'状态',wechat:'虚构微信',type:'类型',rate:'奖励比例',agent:'代理',tea:'茶馆关系',date:'日期',amount:'实付金额',refunded:'退款金额',title:'标题',owner:'受理客服'};
 const columns=fields[referenceEntity],records=db[referenceEntity]||[];
 return heading('开发参考与示例数据库','公开源码、可下载 SQL、虚构数据以及接口交接清单。实际业务接口完善后再开展联调。','<button id="reference-refresh">刷新数据库状态</button>')+
 `<section class="panel policy"><h2>数据库连接状态</h2><div id="reference-database-summary">${referenceDatabaseSummary()}</div></section>`+
 `<section class="panel policy reference-section"><h2>开发资料下载</h2><p>SQL 与 JSON 全部是虚构示例，可用于本地建库、功能联调和开发参考。请在空的测试数据库中导入，避免覆盖已有数据。</p><div class="reference-downloads">${downloads.map(([label,file])=>`<a href="../public/reference/${file}" download>${label}<small>${file}</small></a>`).join('')}</div><p><a class="reference-source" href="https://github.com/wthpein010-dev/mahjong-operations-demo" target="_blank" rel="noopener noreferrer">GitHub 开源代码 ↗</a></p><p class="critical">此备用入口使用浏览器 IndexedDB 本地数据库；已实现的演示 API 仅在 Sites 云端运行，本入口不调用这些 API。OpenAPI 中的业务接口是待接入需求，尚未连接真实游戏、账户和支付系统。</p></section>`+
 `<section class="panel policy reference-section"><h2>接口完善与联调交接</h2><ol class="handoff-flow"><li><strong>阿福 · 完善业务接口</strong><p>逐项核对账号、代理、区域、茶馆、玩家、充值退款、房间对局、奖励与权限接口，提供字段、状态、历史快照、幂等及错误返回。</p></li><li><strong>Nirvana · 接入与对接测试</strong><p>基于同一 OpenAPI 版本接入，核对跨区权限、分页、统计口径、迁区历史和失败重试，记录接口问题后回交阿福修正。</p></li><li><strong>Apifox · 同步最终接口</strong><p>接口完善并完成联调后同步接口定义、示例、环境变量名称及测试用例。当前可下载 OpenAPI 导入，尚未写入实际 Apifox 项目。</p></li></ol><p>完整需求、对接责任与问题反馈流程在 V1.7 Word 文档中说明；公开源码不包含需求 Word、生产数据或连接凭据。</p></section>`+
 `<section class="panel policy reference-section"><h2>当前演示数据 · 只读预览</h2><p>开发参考页的示例数据面向所有访客公开；体验身份用于观察业务页面范围，不是服务端账号授权。</p><div class="toolbar"><label for="reference-entity">数据对象</label><select id="reference-entity">${Object.entries(entityNames).map(([key,label])=>`<option value="${key}" ${key===referenceEntity?'selected':''}>${label}</option>`).join('')}</select><div class="search-box"><input type="search" id="search" aria-label="搜索当前列表" value="${esc(query)}" placeholder="名称或编号"><button id="clear">清空</button></div></div></section>`+
 table(columns.map(k=>names[k]||k),records.map(record=>columns.map(k=>esc(Array.isArray(record[k])?record[k].join('、'):typeof record[k]==='boolean'?(record[k]?'是':'否'):record[k]))));
}
window.addEventListener('beforeunload',event=>{if(databaseState.queue.length||databaseState.busy){event.preventDefault();event.returnValue='';}});
reloadDatabase();
