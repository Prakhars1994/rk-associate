// Server-only helpers for storing website enquiries in Supabase and notifying the office by email.
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optional: SENDGRID_API_KEY, ENQUIRY_NOTIFY_EMAIL, ENQUIRY_FROM_EMAIL.

export type Enquiry = {kind:"business"|"training";name:string;mobile:string;email?:string;company?:string;service?:string;course?:string;experience?:string;employee_count?:string;preferred_batch?:string;message?:string;source_page?:string;user_agent?:string};

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
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Supabase is not configured");
  const res=await fetch(`${url}/rest/v1/enquiries`,{method:"POST",headers:{"Content-Type":"application/json",apikey:key,Authorization:`Bearer ${key}`,Prefer:"return=representation"},body:JSON.stringify(e)});
  if(!res.ok)throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  const [row]=await res.json() as {id:string}[];
  return row.id;
}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));

// Best effort: a missing key or SendGrid error never fails the enquiry, which is already saved.
export async function notifyOffice(e:Enquiry,id:string):Promise<void>{
  const key=process.env.SENDGRID_API_KEY,to=process.env.ENQUIRY_NOTIFY_EMAIL,from=process.env.ENQUIRY_FROM_EMAIL;
  if(!key||!to||!from)return;
  const rows=Object.entries(e).filter(([k,v])=>v&&k!=="user_agent").map(([k,v])=>`<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k.replace(/_/g," "))}</td><td style="padding:4px 0">${esc(String(v))}</td></tr>`).join("");
  const subject=`New ${e.kind} enquiry: ${e.name}${e.service||e.course?` (${e.service||e.course})`:""}`;
  const res=await fetch("https://api.sendgrid.com/v3/mail/send",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({
    personalizations:[{to:to.split(",").map(x=>({email:x.trim()}))}],
    from:{email:from,name:"RK Associate Website"},
    ...(e.email?{reply_to:{email:e.email,name:e.name}}:{}),
    subject,
    content:[{type:"text/html",value:`<h2 style="font-family:sans-serif">${esc(subject)}</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table><p style="font-family:sans-serif;color:#999;font-size:12px">Enquiry id ${id}</p>`}]
  })});
  if(!res.ok)console.error("SendGrid notify failed",res.status,await res.text());
}
