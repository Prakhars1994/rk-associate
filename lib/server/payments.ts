// Server-only Razorpay guest checkout for courses. Prices always come from public.courses, never from the browser.
// Payments are live only when PAYMENTS_ENABLED=true and RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and
// SUPABASE_SERVICE_ROLE_KEY are set. RAZORPAY_WEBHOOK_SECRET enables /api/payments/webhook.
import {emailOffice} from "./email";

export type Course={id:string;slug:string;title:string;price_paise:number};

export function paymentsEnabled(){
  const e=process.env;
  return e.PAYMENTS_ENABLED==="true"&&!!e.RAZORPAY_KEY_ID&&!!e.RAZORPAY_KEY_SECRET&&!!e.SUPABASE_URL&&!!e.SUPABASE_SERVICE_ROLE_KEY;
}

function db(path:string,init:RequestInit={}){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers:Record<string,string>={"Content-Type":"application/json",apikey:key,...(init.headers as Record<string,string>)};
  if(key.startsWith("eyJ"))headers.Authorization=`Bearer ${key}`;
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{...init,headers});
}

function razorpay(path:string,init:RequestInit={}){
  const auth=btoa(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`);
  return fetch(`https://api.razorpay.com/v1/${path}`,{...init,headers:{"Content-Type":"application/json",Authorization:`Basic ${auth}`}});
}

// Active courses with a price, read with the public key (courses_read RLS allows anon).
export async function listPayableCourses():Promise<Course[]>{
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!process.env.SUPABASE_URL||!key)return [];
  const headers:Record<string,string>={apikey:key};
  if(key.startsWith("eyJ"))headers.Authorization=`Bearer ${key}`;
  const res=await fetch(`${process.env.SUPABASE_URL}/rest/v1/courses?select=id,slug,title,price_paise&status=eq.active&price_paise=gt.0`,{headers});
  return res.ok?await res.json() as Course[]:[];
}

export async function createOrder(slug:string){
  const course=(await listPayableCourses()).find(c=>c.slug===slug);
  if(!course)return {ok:false as const,status:404,error:"This course is not available for online payment"};
  const ref=crypto.randomUUID();
  const res=await razorpay("orders",{method:"POST",body:JSON.stringify({amount:course.price_paise,currency:"INR",receipt:ref,notes:{course_slug:course.slug,course_title:course.title}})});
  if(!res.ok){console.error("Razorpay order failed",res.status,await res.text());return {ok:false as const,status:502,error:"Could not start payment"};}
  const order=await res.json() as {id:string;amount:number;currency:string};
  const ins=await db("course_orders",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({id:ref,course_id:course.id,course_slug:course.slug,amount_paise:course.price_paise,razorpay_order_id:order.id})});
  if(!ins.ok){console.error("course_orders insert failed",ins.status,await ins.text());return {ok:false as const,status:500,error:"Could not start payment"};}
  return {ok:true as const,orderId:order.id,amount:order.amount,currency:order.currency,keyId:process.env.RAZORPAY_KEY_ID!,course:{slug:course.slug,title:course.title}};
}

async function hmacHex(secret:string,message:string){
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig),b=>b.toString(16).padStart(2,"0")).join("");
}

function safeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}

export async function checkoutSignatureValid(orderId:string,paymentId:string,signature:string){
  return safeEqual(await hmacHex(process.env.RAZORPAY_KEY_SECRET!,`${orderId}|${paymentId}`),signature);
}

export async function webhookSignatureValid(rawBody:string,signature:string){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
  return !!secret&&safeEqual(await hmacHex(secret,rawBody),signature);
}

export type RazorpayPayment={id:string;order_id:string;amount:number;currency:string;status:string;email?:string;contact?:string;method?:string};

export async function fetchPayment(paymentId:string):Promise<RazorpayPayment|null>{
  const res=await razorpay(`payments/${encodeURIComponent(paymentId)}`);
  return res.ok?await res.json() as RazorpayPayment:null;
}

// Marks the order paid once (idempotent across the checkout callback and the webhook) and emails the office on the first transition.
export async function markPaid(p:RazorpayPayment):Promise<{ok:boolean;error?:string}>{
  if(p.status!=="captured"&&p.status!=="authorized")return {ok:false,error:"Payment not completed"};
  const rowRes=await db(`course_orders?razorpay_order_id=eq.${encodeURIComponent(p.order_id)}&select=id,course_slug,amount_paise,status`);
  const [row]=rowRes.ok?await rowRes.json() as {id:string;course_slug:string;amount_paise:number;status:string}[]:[];
  if(!row)return {ok:false,error:"Unknown order"};
  if(row.amount_paise!==p.amount||p.currency!=="INR")return {ok:false,error:"Amount mismatch"};
  if(row.status==="paid")return {ok:true};
  const upd=await db(`course_orders?id=eq.${row.id}&status=neq.paid`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status:"paid",razorpay_payment_id:p.id,contact:p.contact??null,email:p.email??null,raw:p,paid_at:new Date().toISOString()})});
  if(!upd.ok){console.error("course_orders update failed",upd.status,await upd.text());return {ok:false,error:"Could not record payment"};}
  const changed=(await upd.json() as unknown[]).length>0;
  if(changed){
    const amount=`Rs ${(p.amount/100).toFixed(2)}`;
    try{await emailOffice(`Course payment received: ${row.course_slug} (${amount})`,{course:row.course_slug,amount,email:p.email,contact:p.contact,method:p.method,razorpay_payment_id:p.id,razorpay_order_id:p.order_id},{replyTo:p.email?{email:p.email}:undefined,footer:`Order ref ${row.id}`})}catch(err){console.error("Payment notify error",err)}
  }
  return {ok:true};
}
