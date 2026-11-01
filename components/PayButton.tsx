"use client";
import {FormEvent,useEffect,useState} from "react";

// Payments, accounts and enrolments live in the rk-associate-api Worker (Supabase auth + Razorpay).
const API=process.env.NEXT_PUBLIC_API_URL||"https://rk-associate-api.vliab.workers.dev/api";
const TOKEN_KEY="rk_api_session";

// Website course title -> courses.slug in Supabase. Only courses listed here can be paid online.
const slugByTitle:Record<string,string>={"Professional HR Course":"hr","PF & ESIC Practical Training":"pf"};

type Course={slug:string;title:string;price_paise:number};
type Session={access_token:string;expires_at:number;email:string;name?:string;phone?:string};
type RazorpayResponse={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
declare global{interface Window{Razorpay?:new(o:Record<string,unknown>)=>{open:()=>void}}}

let coursesPromise:Promise<Course[]>|null=null;
const loadCourses=()=>coursesPromise??=fetch(`${API}/courses`).then(r=>r.ok?r.json():{courses:[]}).then(d=>(d.courses||[]) as Course[]).catch(()=>[]);
const loadCheckout=()=>new Promise<void>((ok,fail)=>{if(window.Razorpay)return ok();const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>ok();s.onerror=()=>fail(new Error("Could not load the payment window. Please try again."));document.body.appendChild(s)});

function readSession():Session|null{try{const s=JSON.parse(sessionStorage.getItem(TOKEN_KEY)||"null") as Session|null;return s&&s.expires_at*1000>Date.now()+60000?s:null}catch{return null}}
function saveSession(s:Session|null){try{s?sessionStorage.setItem(TOKEN_KEY,JSON.stringify(s)):sessionStorage.removeItem(TOKEN_KEY)}catch{}}

const errorText:Record<string,string>={invalid_credentials:"Email or password is incorrect.",user_already_exists:"An account with this email already exists. Choose \"I have an account\" to log in.",weak_password:"Please choose a stronger password (at least 8 characters).",already_enrolled:"You are already enrolled in this course. Our team will contact you with batch details.",payments_not_configured:"Online payment is not available right now. Please WhatsApp us to enroll.",too_many_requests:"Too many attempts. Please wait a minute and try again."};
const explain=(code?:string,fallback="Something went wrong. Please try again.")=>(code&&errorText[code])||fallback;

async function api(path:string,body:unknown,token?:string){
  const res=await fetch(`${API}${path}`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  return {status:res.status,data};
}

// Renders nothing unless the API lists this course with a price.
export function PayButton({title}:{title:string}){
  const slug=slugByTitle[title];
  const [course,setCourse]=useState<Course|null>(null);
  const [step,setStep]=useState<"idle"|"account"|"busy"|"paid">("idle");
  const [mode,setMode]=useState<"register"|"login">("register");
  const [msg,setMsg]=useState("");
  useEffect(()=>{if(!slug)return;loadCourses().then(cs=>{const c=cs.find(x=>x.slug===slug&&x.price_paise>0);if(c)setCourse(c)})},[slug]);
  if(!slug||!course)return null;

  async function pay(session:Session){
    setStep("busy");setMsg("");
    try{
      const [{status,data},]=await Promise.all([api("/payments/order",{course_slug:slug},session.access_token),loadCheckout()]);
      if(status===401){saveSession(null);setMode("login");setStep("account");setMsg("Please log in again to continue.");return}
      if(status!==201){setStep("idle");setMsg(explain(data.error||data.message));return}
      new window.Razorpay!({key:data.key_id,order_id:data.order_id,amount:data.amount,currency:data.currency,name:"RK Associate",description:data.course.title,theme:{color:"#6b1f3a"},
        prefill:{email:session.email,name:session.name||data.prefill?.name||"",contact:session.phone||""},
        handler:async(r:RazorpayResponse)=>{const v=await api("/payments/verify",r,session.access_token).catch(()=>({status:0,data:{}}));if(v.status===200){setStep("paid");setMsg("Payment received - you are enrolled! A receipt is on its way to "+session.email+". Our team will contact you with batch details.")}else{setStep("idle");setMsg("We received your payment but could not confirm it here. Please WhatsApp us your payment id: "+r.razorpay_payment_id)}},
        modal:{ondismiss:()=>setStep("idle")}}).open();
    }catch(err){setStep("idle");setMsg(err instanceof Error?err.message:explain())}
  }

  function start(){setMsg("");const s=readSession();if(s)pay(s);else setStep("account")}

  async function submitAccount(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>;
    const email=f.email.trim().toLowerCase();
    setStep("busy");
    const {status,data}=mode==="register"
      ?await api("/auth/register",{email,password:f.password,full_name:f.name.trim(),...(f.phone.trim()?{phone:f.phone.trim()}:{})})
      :await api("/auth/login",{email,password:f.password});
    if((status===200||status===201)&&data.access_token){
      const s:Session={access_token:data.access_token,expires_at:data.expires_at,email,name:f.name?.trim(),phone:f.phone?.trim()};
      saveSession(s);pay(s);return;
    }
    setStep("account");
    if(status===201&&data.needs_confirmation){setMode("login");setMsg(`Account created. We've emailed a confirmation link to ${email} - open it, then come back here and log in to pay.`);return}
    if(status===429){setMsg(explain("too_many_requests"));return}
    setMsg(explain(data.error,data.message||explain()));
  }

  if(step==="paid")return <span className="payNote">{msg}</span>;
  return <>
    {step!=="account"&&<button type="button" className="btn" onClick={start} disabled={step==="busy"}>{step==="busy"?"Please wait…":`Pay ₹${(course.price_paise/100).toLocaleString("en-IN")} & Enroll`}</button>}
    {step==="account"&&<form className="form payAccount" onSubmit={submitAccount}>
      <div className="payTabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode==="register"} className={mode==="register"?"active":""} onClick={()=>{setMode("register");setMsg("")}}>New student</button>
        <button type="button" role="tab" aria-selected={mode==="login"} className={mode==="login"?"active":""} onClick={()=>{setMode("login");setMsg("")}}>I have an account</button>
      </div>
      {mode==="register"&&<input name="name" placeholder="Full name" autoComplete="name" required minLength={2} maxLength={120}/>}
      <input name="email" type="email" placeholder="Email" autoComplete="email" required maxLength={255}/>
      {mode==="register"&&<input name="phone" inputMode="tel" placeholder="Mobile" autoComplete="tel" pattern="[0-9+\- ]{7,20}"/>}
      <input name="password" type="password" placeholder={mode==="register"?"Create a password (min 8 characters)":"Password"} autoComplete={mode==="register"?"new-password":"current-password"} required minLength={mode==="register"?8:1} maxLength={72}/>
      <button className="btn" type="submit">{mode==="register"?"Create account & pay":"Log in & pay"} ₹{(course.price_paise/100).toLocaleString("en-IN")}</button>
      <button type="button" className="payCancel" onClick={()=>{setStep("idle");setMsg("")}}>Cancel</button>
    </form>}
    {msg&&<span className="payNote" role="status">{msg}</span>}
  </>;
}
