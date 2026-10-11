import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=(process.argv[2]||'http://127.0.0.1:8766').replace(/\/$/,'');
let checks=0;const check=(value,message)=>{assert(value,message);checks++};
const statePath=base+'/api/v1/demo/state';
const sandboxCookie=response=>response.headers.getSetCookie().find(value=>value.startsWith('maliu_sandbox='))?.split(';')[0];
const read=async(token='')=>{const response=await fetch(statePath,{headers:token?{Cookie:token}:{}});return {data:await response.json(),token:sandboxCookie(response)||token}};
const status=await (await fetch(base+'/api/v1/reference/status')).json();
check(status.seeded&&status.tables.agents===24&&status.tables.rooms===360,'Normalized data counts');
const firstRead=await read(),initial=firstRead.data,token=firstRead.token;
check(initial.mode==='reference'&&initial.revision===0,'Initial public state');
check(/^[a-f0-9]{64}$/.test(initial.sessionId)&&initial.sessionId===createHash('sha256').update(token.split('=')[1]).digest('hex'),'Read establishes Cookie-bound public fingerprint');
const data=structuredClone(initial.data);data.config.lowRooms=6;
const write=(revision,value,currentToken=token,sessionId=initial.sessionId,origin=base)=>fetch(statePath,{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'If-Match':String(revision),'X-Demo-Session':sessionId,Cookie:currentToken},body:JSON.stringify({data:value})});
const first=await write(0,data);check(first.status===200,'Create database sandbox');
const firstResult=await first.json();check(firstResult.revision===1&&firstResult.sessionId===initial.sessionId&&!sandboxCookie(first),'First save retains read identity');
try{
 const saved=(await read(token)).data;check(saved.mode==='sandbox'&&saved.data.config.lowRooms===6,'Durable sandbox read');
 const other=await read();check(other.data.data.config.lowRooms===initial.data.config.lowRooms,'Visitor isolation');
 data.config.lowRooms=7;check((await write(1,data)).status===200,'Optimistic update');
 check((await write(1,data)).status===409,'Stale update rejected');
 check((await write(2,data,token,initial.sessionId,'https://untrusted.example')).status===403,'Cross-origin write rejected');
 const tampered=structuredClone(data);tampered.charges[0].amount=999999;check((await write(2,tampered)).status===403,'Readonly source event rejected');
 const list=await (await fetch(base+'/api/v1/reference/entities/agents?page=2&pageSize=10')).json();check(list.items.length===10&&list.total===24&&list.page===2,'Real SQL pagination');
 check((await fetch(base+'/api/v1/reference/entities/demo_snapshots')).status===404,'Private snapshot table inaccessible');
 check((await fetch(base+'/api/v1/reference/entities/agents?pageSize=1000')).status===400,'Bounded SQL page size');
 // Two initially empty tabs may get different read cookies; the shared browser
 // keeps the later one. The earlier tab must never write to that other identity.
 const tabA=await read(),tabB=await read();
 check((await write(0,data,tabB.token,tabA.data.sessionId)).status===409,'Concurrent initial tab identity mismatch rejected');
 const [a,b]=await Promise.all([write(0,data,tabB.token,tabB.data.sessionId),write(0,data,tabB.token,tabB.data.sessionId)]);
 check([a.status,b.status].sort().join(',')==='200,409','Concurrent first save produces one success and one conflict');
 check((await write(1,data,tabB.token,tabA.data.sessionId)).status===409,'Old tab cannot overwrite new sandbox with matching revision');
 await a.text();await b.text();
 const missing=await fetch(statePath,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,'If-Match':'2',Cookie:token},body:JSON.stringify({data})});check(missing.status===428,'Write requires read-session fingerprint');
 const resetB=await fetch(statePath,{method:'DELETE',headers:{Origin:base,Cookie:tabB.token,'X-Demo-Session':tabB.data.sessionId}});
 const resetResult=await resetB.json(),rotated=sandboxCookie(resetB);
 check(resetB.status===200&&resetResult.sessionId!==tabB.data.sessionId,'Reset rotates browser identity');
 check((await write(0,data,rotated,tabB.data.sessionId)).status===409,'Pre-reset tab cannot modify rotated session');
 check((await write(0,data,tabB.token,tabB.data.sessionId)).status===200,'Different client retaining its own Cookie remains isolated');
 await fetch(statePath,{method:'DELETE',headers:{Origin:base,Cookie:tabB.token,'X-Demo-Session':tabB.data.sessionId}});
}finally{
 const reset=await fetch(statePath,{method:'DELETE',headers:{Origin:base,Cookie:token,'X-Demo-Session':initial.sessionId}});check(reset.status===200,'Sandbox reset');
 const after=(await read(sandboxCookie(reset))).data;check(after.mode==='reference','Reset session returns public data');
}
console.log(checks+' API persistence, isolation, concurrency and permission checks passed');
