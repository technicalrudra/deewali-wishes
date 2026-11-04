import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
function database(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return null;return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
const unavailable=()=>NextResponse.json({error:'The global light counter is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});
export async function GET(){const db=database();if(!db)return unavailable();try{const {data,error}=await db.from('diwali_stats').select('total_diyas_lit').eq('id',1).single();if(error||!data)return unavailable();return NextResponse.json({count:Number(data.total_diyas_lit)},{headers:{'Cache-Control':'no-store'}});}catch{return unavailable();}}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin){try{if(new URL(origin).host!==request.headers.get('host'))return NextResponse.json({error:'Invalid origin'},{status:403});}catch{return NextResponse.json({error:'Invalid origin'},{status:403});}}
 let eventId:unknown;try{({eventId}=await request.json());}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
 if(typeof eventId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId))return NextResponse.json({error:'A valid lighting event is required.'},{status:400});
 const db=database();if(!db)return unavailable();try{const {data,error}=await db.rpc('record_diya_light',{lighting_event:eventId});if(error||data===null)return unavailable();return NextResponse.json({count:Number(data)},{headers:{'Cache-Control':'no-store'}});}catch{return unavailable();}
}
