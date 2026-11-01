// Server-only helpers for storing website enquiries in Supabase and notifying the office by email.
// Required env: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (insert-only via RLS) or SUPABASE_SERVICE_ROLE_KEY.
// Optional: SENDGRID_API_KEY, ENQUIRY_NOTIFY_EMAIL, ENQUIRY_FROM_EMAIL.
import {emailOffice} from "./email";

export type Enquiry ={kind:"business"|"training";name:string;mobile:string;email?:string;company?:string;service?:string;course?:string;experience?:string;employee_count?:string;preferred_batch?:string;message?:string;source_page?:string;user_agent?:string};

const limits:Record<string,number>={name:120,mobile:20,email:200,company:200,service:120,course:120,experience:40,employee_count:20,preferred_batch:120,message:4000};

// Form field names on /contact -> column names.
const fieldMap:Record<string,keyof Enquiry>={Name:"name",Mobile:"mobile",Email:"email",Company:"company",Required_Service:"service",Course:"course",Experience:"experience",Employee_Count:"employee_count",Preferred_Batch:"preferred_batch",Message:"message"};

export function parseEnquiry(body:unknown):{ok:true;enquiry:Enquiry}|{ok:false;error:string}{
  if(!body||typeof body!=="object")return {ok:false,error:"Invalid request body"};
  const b=body as Record<string,unknown>;
  if(b.kind!=="business"&&b.kind!=="training")return {ok:false,error:"kind must be business or training"};
  const fields=(b.fields&&typeof b.fields==="object"?b.fields:{}) as Record<string,unknown>;
  const e:Enquiry={kind:b.kind,name:"",mobile:""};
  for(const [formName,col] of Object.entries(fieldMap)){
    const v=typeof fields[formName]==="string"?(fields[formName] as string).trim():"";
    if(!v)continue;
    if(v.length>limits[col])return {ok:false,error:`${formName} is too long`};
    (e as Record<string,unknown>)[col]=v;
  }
  if(!e.name)return {ok:false,error:"Name is required"};
  const digits=e.mobile.replace(/\D/g,"");
  if(digits.length<10||digits.length>13)return {ok:false,error:"Enter a valid mobile number"};
  if(e.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))return {ok:false,error:"Enter a valid email"};
  if(typeof b.source_page==="string")e.source_page=b.source_page.slice(0,200);
  return {ok:true,enquiry:e};
}

export async function saveEnquiry(e:Enquiry):Promise<string>{
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error("Supabase is not configured");
  // The publishable key cannot read rows back, so the id is generated here and the insert returns nothing.
  const id=crypto.randomUUID();
  const headers:Record<string,string>={"Content-Type":"application/json",apikey:key,Prefer:"return=minimal"};
  if(key.startsWith("eyJ"))headers.Authorization=`Bearer ${key}`; // legacy JWT keys also need the bearer header
  const res=await fetch(`${url}/rest/v1/enquiries`,{method:"POST",headers,body:JSON.stringify({...e,id})});
  if(!res.ok)throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  return id;
}

// Best effort: a missing key or SendGrid error never fails the enquiry, which is already saved.
export async function notifyOffice(e:Enquiry,id:string):Promise<void>{
  const {user_agent:_ua,...fields}=e;
  await emailOffice(`New ${e.kind} enquiry: ${e.name}${e.service||e.course?` (${e.service||e.course})`:""}`,fields,{replyTo:e.email?{email:e.email,name:e.name}:undefined,footer:`Enquiry id ${id}`});
}
