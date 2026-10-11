import {apiFailure,cookie,database,ensureSeed,json,newSandboxToken,sameOrigin,sandboxId,seedId,sessionFingerprint,snapshot} from '../../../../../lib/reference-db';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  await ensureSeed();const current=sandboxId(request),token=current?current.slice(8):newSandboxToken(),id='sandbox-'+token;
  const privateRow=await snapshot(id),item=privateRow??await snapshot(seedId);if(!item)throw new Error('SEED_MISSING');
  return json({data:JSON.parse(item.data_json),revision:item.revision,mode:privateRow?'sandbox':'reference',sessionId:await sessionFingerprint(id)},200,current?{}:{'Set-Cookie':cookie(request,token)});
 }catch(error){return apiFailure(error)}
}
async function checkedSession(request:Request){
 const fingerprint=request.headers.get('x-demo-session');
 if(!fingerprint||!/^[a-f0-9]{64}$/.test(fingerprint))return {error:json({code:'SESSION_REQUIRED',message:'请先读取数据库会话'},428)};
 const id=sandboxId(request);
 if(!id||await sessionFingerprint(id)!==fingerprint)return {error:json({code:'SESSION_CONFLICT',message:'浏览器会话已变化，请重新载入数据库数据'},409)};
 return {id,sessionId:fingerprint};
}
export async function POST(request:Request){
 if(Number(request.headers.get('content-length')||0)>600000)return json({code:'PAYLOAD_TOO_LARGE',message:'演示数据过大'},413);
 try{
  const raw=await request.text();if(new TextEncoder().encode(raw).length>600000)return json({code:'PAYLOAD_TOO_LARGE',message:'演示数据过大'},413);
  // Consume bounded request bodies before early denial so the local Worker proxy
  // does not restart with an unread large POST stream.
  if(!sameOrigin(request))return json({code:'ORIGIN_REJECTED',message:'请求来源不匹配'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({code:'INVALID_CONTENT_TYPE',message:'请使用JSON'},415);
  const session=await checkedSession(request);if(session.error)return session.error;
  let body;try{body=JSON.parse(raw)}catch{return json({code:'INVALID_JSON',message:'JSON格式不正确'},400)}
  await ensureSeed();const base=await snapshot(seedId);if(!base)throw new Error('SEED_MISSING');const initial=JSON.parse(base.data_json),value=body?.data;
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==Object.keys(initial).sort().join('|'))return json({code:'INVALID_STATE',message:'演示数据字段不完整'},400);
  for(const [key,item] of Object.entries(initial)){if(Array.isArray(item)&&(!Array.isArray(value[key])||value[key].length>item.length+300))return json({code:'INVALID_STATE',message:'演示记录数量超限'},400)}
  for(const key of ['rooms','charges','transfers','players'])if(JSON.stringify(value[key])!==JSON.stringify(initial[key]))return json({code:'READ_ONLY_DATA',message:'充值、对局、转卡和玩家来源数据只读'},403);
  const match=request.headers.get('if-match');if(!match||!/^\d+$/.test(match))return json({code:'REVISION_REQUIRED',message:'缺少If-Match版本'},428);
  const revision=Number(match);if(!Number.isSafeInteger(revision))return json({code:'INVALID_REVISION',message:'If-Match版本超出有效整数范围'},400);
  const id=session.id!;let existing=await snapshot(id);
  if(!existing){
   if(revision!==0)return json({code:'REVISION_CONFLICT',message:'请重新载入数据库数据',revision:0},409);
   const inserted=await database().prepare('INSERT INTO demo_snapshots(id,data_json,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(id) DO NOTHING').bind(id,JSON.stringify(value),new Date().toISOString()).run();
   if(!inserted.meta.changes){existing=await snapshot(id);return json({code:'REVISION_CONFLICT',message:'其他页面已首次保存，请重新载入',revision:existing?.revision||0},409)}
   return json({revision:1,mode:'sandbox',sessionId:session.sessionId});
  }
  const result=await database().prepare('UPDATE demo_snapshots SET data_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(value),new Date().toISOString(),id,revision).run();
  if(!result.meta.changes){existing=await snapshot(id);return json({code:'REVISION_CONFLICT',message:'数据已在其他页面更新，请重新载入',revision:existing?.revision||0},409)}
  return json({revision:revision+1,mode:'sandbox',sessionId:session.sessionId});
 }catch(error){return apiFailure(error)}
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return json({code:'ORIGIN_REJECTED',message:'请求来源不匹配'},403);
 try{
  const session=await checkedSession(request);if(session.error)return session.error;
  await ensureSeed();await database().prepare('DELETE FROM demo_snapshots WHERE id=?').bind(session.id!).run();
  const row=await snapshot(seedId),token=newSandboxToken();
  return json({data:JSON.parse(row!.data_json),revision:0,mode:'reference',sessionId:await sessionFingerprint('sandbox-'+token)},200,{'Set-Cookie':cookie(request,token)});
 }catch(error){return apiFailure(error)}
}
