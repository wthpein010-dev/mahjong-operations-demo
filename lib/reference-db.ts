import {env} from 'cloudflare:workers';
import seed from '../database/seed-statements.json';
let initializing:Promise<void>|undefined;
export const database=()=>{if(!env.DB)throw new Error('DB_UNAVAILABLE');return env.DB;};
export async function ensureSeed(){
 const db=database();
 const marker=await db.prepare("SELECT value FROM demo_seed_meta WHERE key='seed-version'").first<{value:string}>();
 if(marker?.value==='v1.7')return;
 initializing??=(async()=>{for(let i=0;i<seed.statements.length;i+=40){await db.batch(seed.statements.slice(i,i+40).map(s=>db.prepare(s.sql).bind(...s.params)));}})().finally(()=>{initializing=undefined;});
 await initializing;
}
export function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
export function apiFailure(error:unknown){console.error('Reference API failure',error instanceof Error?error.message:'unknown');return json({code:'DATABASE_UNAVAILABLE',message:'数据库暂不可用，请稍后重试'},503);}
export async function snapshot(id:string){return database().prepare('SELECT data_json,revision FROM demo_snapshots WHERE id=?').bind(id).first<{data_json:string,revision:number}>();}
export const seedId='public-v17';
export function sandboxId(request:Request){const id=request.headers.get('cookie')?.match(/(?:^|;\s*)maliu_sandbox=([a-f0-9]{64})(?:;|$)/)?.[1];return id?'sandbox-'+id:null;}
export function newSandboxToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function sessionFingerprint(id:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id.slice(8)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export function cookie(request:Request,id:string,clear=false){return 'maliu_sandbox='+id+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(clear?'0':'2592000')+(new URL(request.url).protocol==='https:'?'; Secure':'');}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export const entityTables=Object.keys(seed.counts).filter(k=>!k.startsWith('demo_'));
