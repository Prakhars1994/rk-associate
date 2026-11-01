"use client";
import {useEffect,useState} from "react";

// Website course title -> courses.slug in Supabase. Only courses listed here can be paid online.
const slugByTitle:Record<string,string>={"Professional HR Course":"hr","PF & ESIC Practical Training":"pf"};

type Config={enabled:boolean;keyId?:string;courses:{slug:string;title:string;price_paise:number}[]};
type RazorpayResponse={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
declare global{interface Window{Razorpay?:new(o:Record<string,unknown>)=>{open:()=>void}}}

let configPromise:Promise<Config>|null=null;
const loadConfig=()=>configPromise??=fetch("/api/payments/config").then(r=>r.json() as Promise<Config>).catch(()=>({enabled:false,courses:[]}));
const loadCheckout=()=>new Promise<void>((ok,fail)=>{if(window.Razorpay)return ok();const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>ok();s.onerror=()=>fail(new Error("Could not load payment window"));document.body.appendChild(s)});

// Renders nothing unless online payment is switched on and this course has a price.
export function PayButton({title}:{title:string}){
  const slug=slugByTitle[title];
  const [price,setPrice]=useState<number|null>(null);
  const [state,setState]=useState<"idle"|"busy"|"paid"|"error">("idle");
  const [msg,setMsg]=useState("");
  useEffect(()=>{if(!slug)return;loadConfig().then(c=>{const course=c.enabled&&c.courses.find(x=>x.slug===slug);if(course)setPrice(course.price_paise)})},[slug]);
  if(!slug||price===null)return null;
  async function pay(){
    setState("busy");setMsg("");
    try{
      const [order]=await Promise.all([fetch("/api/payments/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({course_slug:slug})}).then(r=>r.json()),loadCheckout()]);
      if(!order.ok)throw new Error(order.error||"Could not start payment");
      new window.Razorpay!({key:order.keyId,order_id:order.orderId,amount:order.amount,currency:order.currency,name:"RK Associate",description:order.course.title,theme:{color:"#6b1f3a"},
        handler:async(r:RazorpayResponse)=>{const v=await fetch("/api/payments/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}).then(x=>x.json()).catch(()=>({ok:false}));if(v.ok){setState("paid");setMsg("Payment received. Our team will contact you with batch details.")}else{setState("error");setMsg("We received your payment but could not confirm it here. Please WhatsApp us your payment id: "+r.razorpay_payment_id)}},
        modal:{ondismiss:()=>setState("idle")}}).open();
    }catch(err){setState("error");setMsg(err instanceof Error?err.message:"Could not start payment")}
  }
  return <>{state==="paid"?<span className="payNote">{msg}</span>:<button type="button" className="btn" onClick={pay} disabled={state==="busy"}>{state==="busy"?"Opening payment…":`Pay ₹${(price/100).toLocaleString("en-IN")} & Enroll`}</button>}{state==="error"&&<span className="payNote" role="alert">{msg}</span>}</>;
}
