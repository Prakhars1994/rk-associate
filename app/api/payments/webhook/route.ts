import {markPaid,webhookSignatureValid,type RazorpayPayment} from "@/lib/server/payments";

// Razorpay webhook (events: payment.captured, order.paid). Backs up the browser callback if the visitor closes the tab.
export async function POST(req:Request){
  const raw=await req.text();
  if(!await webhookSignatureValid(raw,req.headers.get("x-razorpay-signature")||""))return new Response("Invalid signature",{status:401});
  let event:{event?:string;payload?:{payment?:{entity?:RazorpayPayment}}};
  try{event=JSON.parse(raw)}catch{return new Response("Invalid JSON",{status:400})}
  const p=event.payload?.payment?.entity;
  if((event.event==="payment.captured"||event.event==="order.paid")&&p){
    const r=await markPaid(p);
    if(!r.ok)console.error("Webhook markPaid",r.error,p.order_id);
  }
  return new Response("ok");
}
