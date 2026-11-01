import {checkoutSignatureValid,fetchPayment,markPaid,paymentsEnabled} from "@/lib/server/payments";

// Called by the browser after Razorpay Checkout succeeds. The signature proves the ids came from Razorpay;
// the payment is then re-fetched from Razorpay so amount and status are never taken from the browser.
export async function POST(req:Request){
  if(!paymentsEnabled())return Response.json({ok:false,error:"Online payment is not available"},{status:503});
  let b:Record<string,unknown>;
  try{b=await req.json()}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400})}
  const orderId=b.razorpay_order_id,paymentId=b.razorpay_payment_id,signature=b.razorpay_signature;
  if(typeof orderId!=="string"||typeof paymentId!=="string"||typeof signature!=="string")return Response.json({ok:false,error:"Missing payment details"},{status:400});
  if(!await checkoutSignatureValid(orderId,paymentId,signature))return Response.json({ok:false,error:"Payment could not be verified"},{status:400});
  const p=await fetchPayment(paymentId);
  if(!p||p.order_id!==orderId)return Response.json({ok:false,error:"Payment could not be verified"},{status:400});
  const r=await markPaid(p);
  return Response.json(r,{status:r.ok?200:400});
}
