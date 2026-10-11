// Maintained source for the GitHub Pages demo. No cloud API, fetch interception or memory fallback.
// The fixed database belongs to this browser profile and origin; every tab shares its revision.
(function(){
 'use strict';
 const NAME='mahjong-operations-pages-v17',STORE='snapshots';
 const ARRAYS=['regions','managers','services','agents','tea','players','charges','rooms','transfers','logs','tickets','announcements','messages','tasks','read','ack','access','migrations'];
 const PROTECTED=['players','charges','rooms','transfers'];
 let connection,initialization;
 function problem(message,status=503,code='LOCAL_STORAGE_ERROR'){const e=new Error(message);e.status=status;e.code=code;return e;}
 function storageProblem(e){return e?.status?e:problem('IndexedDB 浏览器本地存储不可用或保存失败（'+(e?.name||'存储错误')+'），请检查浏览器存储权限与剩余空间');}
 function shape(data){return data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===19&&ARRAYS.every(k=>Array.isArray(data[k]))&&data.config&&typeof data.config==='object'&&!Array.isArray(data.config);}
 function session(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
 function validRecord(record){return record&&shape(record.data)&&Number.isSafeInteger(record.revision)&&record.revision>=0&&['reference','sandbox'].includes(record.mode)&&/^[a-f0-9]{64}$/.test(record.sessionId||'');}
 function open(){
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
   let request,timer,failed=false;
   const fail=e=>{failed=true;clearTimeout(timer);reject(storageProblem(e));};
   try{if(!window.indexedDB)throw new Error('IndexedDB unavailable');request=indexedDB.open(NAME,1);}catch(e){fail(e);return;}
   timer=setTimeout(()=>fail(problem('IndexedDB 打开超时，请关闭占用数据库的旧标签页后重试')),12000);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
   request.onerror=()=>fail(request.error);
   request.onblocked=()=>fail(problem('IndexedDB 被旧标签页占用，请关闭旧页面后重试'));
   request.onsuccess=()=>{clearTimeout(timer);const db=request.result;if(failed){db.close();return;}db.onversionchange=()=>{db.close();connection=null;initialization=null;};resolve(db);};
  }).catch(e=>{connection=null;throw e;});
  return connection;
 }
 // Check and mutation run synchronously in one IndexedDB transaction. Only oncomplete confirms durability.
 function transaction(db,mode,operate){
  return new Promise((resolve,reject)=>{
   let tx,result,failure;
   try{
    tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE),baselineRequest=store.get('baseline'),countRequest=store.count(),currentRequest=store.get('current');
    currentRequest.onsuccess=()=>{
     try{result=operate(store,baselineRequest.result,currentRequest.result,countRequest.result);}catch(e){failure=e;tx.abort();}
    };
    tx.oncomplete=()=>resolve(result);
    tx.onabort=()=>reject(storageProblem(failure||tx.error));
    tx.onerror=()=>{failure=failure||tx.error;};
   }catch(e){try{tx?.abort();}catch{}reject(storageProblem(e));}
  });
 }
 async function initialize(){
  if(initialization)return initialization;
  initialization=(async()=>{
   const db=await open();
   const exists=await transaction(db,'readonly',(_,baseline,current)=>{
    if(!baseline&&!current)return false;
    if(!shape(baseline)||!validRecord(current))throw problem('IndexedDB 本地数据结构异常，未使用内存或云端数据替代');
    return true;
   });
   if(!exists){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let baseline;
    try{const url=new URL('../public/reference/seed.json',location.href);if(url.origin!==location.origin)throw problem('初始数据必须来自本站');const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw problem('无法读取本站初始虚构数据（HTTP '+response.status+'）');baseline=await response.json();if(!shape(baseline))throw problem('本站初始虚构数据结构不完整');}catch(e){throw e?.name==='AbortError'?problem('本站初始数据读取超时，请重试'):storageProblem(e);}finally{clearTimeout(timer);}
    await transaction(db,'readwrite',(store,stored,current)=>{
     if(stored||current){if(!shape(stored)||!validRecord(current))throw problem('IndexedDB 本地数据结构异常');return;}
     store.put(structuredClone(baseline),'baseline');store.put({data:structuredClone(baseline),revision:0,mode:'reference',sessionId:session()},'current');
    });
   }
   return db;
  })().catch(e=>{initialization=null;throw e;});
  return initialization;
 }
 async function request(input={}){
  const method=input.method||'GET';if(!['GET','POST','DELETE'].includes(method))throw problem('不支持的本地操作',405,'METHOD_NOT_ALLOWED');
  const db=await initialize();
  return transaction(db,method==='GET'?'readonly':'readwrite',(store,baseline,current)=>{
   if(!shape(baseline)||!validRecord(current))throw problem('IndexedDB 本地数据结构异常');
   if(method==='GET')return structuredClone(current);
   if(!/^[a-f0-9]{64}$/.test(input.sessionId||''))throw problem('本地演示会话缺失，请重新加载数据库',428,'SESSION_REQUIRED');
   if(input.sessionId!==current.sessionId)throw problem('本地演示会话已恢复或变化，请重新加载数据库',409,'SESSION_CONFLICT');
   if(!Number.isSafeInteger(input.revision)||input.revision<0)throw problem('缺少有效的本地数据库版本',428,'REVISION_REQUIRED');
   if(input.revision!==current.revision)throw problem('其他标签页已保存新版本，请重新加载本地数据库',409,'REVISION_CONFLICT');
   if(current.revision>=Number.MAX_SAFE_INTEGER)throw problem('本地数据库版本达到上限');
   let data;
   if(method==='POST'){
    if(!shape(input.data))throw problem('保存的数据结构不完整',400,'INVALID_STATE');
    try{data=structuredClone(input.data);}catch{throw problem('保存的数据无法序列化',400,'INVALID_STATE');}
    for(const key of PROTECTED)if(JSON.stringify(data[key])!==JSON.stringify(baseline[key]))throw problem('玩家、充值退款、房间对局及转卡源数据只读',403,'READONLY_SOURCE');
   }else data=structuredClone(baseline);
   const next={data,revision:current.revision+1,mode:method==='POST'?'sandbox':'reference',sessionId:method==='POST'?current.sessionId:session()};
   store.put(next,'current');return structuredClone(next);
  });
 }
 async function status(){
  const db=await initialize();
  return transaction(db,'readonly',(_,baseline,current,recordCount)=>{
   if(!shape(baseline)||!validRecord(current))throw problem('IndexedDB 本地数据结构异常');
   return {storage:'IndexedDB',available:true,dataset:'v1.7-fictional-browser-local',seeded:true,snapshotRecords:recordCount,revision:current.revision,tables:Object.fromEntries(Object.entries(current.data).map(([key,value])=>[key,Array.isArray(value)?value.length:Object.keys(value).length]))};
  });
 }
 window.PagesDemoDatabase=Object.freeze({request,status});
})();
