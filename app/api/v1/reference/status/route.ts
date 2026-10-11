import {apiFailure,database,ensureSeed,entityTables,json} from '../../../../../lib/reference-db';
export const dynamic='force-dynamic';
export async function GET(){try{await ensureSeed();const rows=await database().batch(entityTables.map(name=>database().prepare('SELECT COUNT(*) AS count FROM "'+name+'"')));const tables=Object.fromEntries(entityTables.map((name,i)=>[name,(rows[i].results?.[0] as {count:number})?.count||0]));return json({storage:'Cloudflare D1',dataset:'v1.7-fictional',tables,seeded:true});}catch(error){return apiFailure(error)}}
