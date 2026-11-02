"use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {API,apiCall,explain,readSession,saveSession,signIn,type Session} from "@/lib/studentApi";

// Website course title -> courses.slug in Supabase. Only courses listed here can be paid online.
const slugByTitle:Record<string,string>={"Professional HR Course":"hr","PF & ESIC Practical Training":"pf"};

type Course={slug:string;title:string;price_paise:number};
type RazorpayResponse={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
declare global{interface Window{Razorpay?:new(o:Record<string,unknown>)=>{open:()=>void}}}

let coursesPromise:Promise<Course[]>|null=null;
const loadCourses=()=>coursesPromise??=fetch(`${API}/courses`).then(r=>r.ok?r.json():{courses:[]}).then(d=>(d.courses||[]) as Course[]).catch(()=>[]);
const loadCheckout=()=>new Promise<void>((ok,fail)=>{if(window.Razorpay)return ok();const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>ok();s.onerror=()=>fail(new Error("Could not load the payment window. Please try again."));document.body.appendChild(s)});

// Renders nothing unless the API lists this course with a price.
export function PayButton({title}:{title:string}){
  const slug=slugByTitle[title];
  const [course,setCourse]=useState<Course|null>(null);
  const [step,setStep]=useState<"idle"|"account"|"busy"|"paid">("idle");
  const [mode,setMode]=useState<"register"|"login">("register");
  const [msg,setMsg]=useState("");
  useEffect(()=>{if(!slug)return;loadCourses().then(cs=>{const c=cs.find(x=>x.slug===slug&&x.price_paise>0);if(c)setCourse(c)})},[slug]);
  if(!slug||!course)return null;
  const price=`₹${(course.price_paise/100).toLocaleString("en-IN")}`;

  async function pay(session:Session){
    setStep("busy");setMsg("");
    try{
      const [{status,data}]=await Promise.all([apiCall("/payments/order",{body:{course_slug:slug},token:session.access_token}),loadCheckout()]);
      if(status===401){saveSession(null);setMode("login");setStep("account");setMsg("Please log in again to continue.");return}
      if(status!==201){setStep("idle");setMsg(explain(data.error||data.message));return}
      new window.Razorpay!({key:data.key_id,order_id:data.order_id,amount:data.amount,currency:data.currency,name:"RK Associate",description:data.course.title,theme:{color:"#D70015"},
        prefill:{email:session.email,name:session.name||data.prefill?.name||"",contact:session.phone||""},
        handler:async(r:RazorpayResponse)=>{const v=await apiCall("/payments/verify",{body:r,token:session.access_token});if(v.status===200){setStep("paid");setMsg("Payment received - you are enrolled! A receipt is on its way to "+session.email+". Our team will contact you with batch details.")}else{setStep("idle");setMsg("We received your payment but could not confirm it here. Please WhatsApp us your payment id: "+r.razorpay_payment_id)}},
        modal:{ondismiss:()=>setStep("idle")}}).open();
    }catch(err){setStep("idle");setMsg(err instanceof Error?err.message:explain())}
  }

  function start(){setMsg("");const s=readSession();if(s)pay(s);else setStep("account")}

  async function submitAccount(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");
    const f=Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>;
    setStep("busy");
    const r=await signIn(mode,{email:f.email,password:f.password,name:f.name,phone:f.phone});
    if(r.session){pay(r.session);return}
    setStep("account");
    if(r.needsConfirmation)setMode("login");
    setMsg(r.message||explain());
  }

  if(step==="paid")return <span className="payNote">{msg} <Link href="/my-courses">Go to My Courses →</Link></span>;
  return <>
    {step!=="account"&&<button type="button" className="btn" onClick={start} disabled={step==="busy"}>{step==="busy"?"Please wait…":`Pay ${price} & Enroll`}</button>}
    {step==="account"&&<form className="form payAccount" onSubmit={submitAccount}>
      <div className="payTabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode==="register"} className={mode==="register"?"active":""} onClick={()=>{setMode("register");setMsg("")}}>New student</button>
        <button type="button" role="tab" aria-selected={mode==="login"} className={mode==="login"?"active":""} onClick={()=>{setMode("login");setMsg("")}}>I have an account</button>
      </div>
      {mode==="register"&&<input name="name" placeholder="Full name" aria-label="Full name" autoComplete="name" required minLength={2} maxLength={120}/>}
      <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required maxLength={255}/>
      {mode==="register"&&<input name="phone" inputMode="tel" placeholder="Mobile" aria-label="Mobile" autoComplete="tel" pattern="[0-9+\- ]{7,20}"/>}
      <input name="password" type="password" placeholder={mode==="register"?"Create a password (min 8 characters)":"Password"} aria-label={mode==="register"?"Create a password (min 8 characters)":"Password"} autoComplete={mode==="register"?"new-password":"current-password"} required minLength={mode==="register"?8:1} maxLength={72}/>
      <button className="btn" type="submit">{mode==="register"?"Create account & pay":"Log in & pay"} {price}</button>
      <button type="button" className="payCancel" onClick={()=>{setStep("idle");setMsg("")}}>Cancel</button>
      {mode==="login"&&<Link className="payCancel" href="/login#forgot">Forgot password?</Link>}
    </form>}
    {msg&&<span className="payNote" role="status">{msg}</span>}
  </>;
}
