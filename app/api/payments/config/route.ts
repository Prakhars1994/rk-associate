import {listPayableCourses,paymentsEnabled} from "@/lib/server/payments";

export const dynamic="force-dynamic";

export async function GET(){
  if(!paymentsEnabled())return Response.json({enabled:false,courses:[]});
  const courses=(await listPayableCourses()).map(({slug,title,price_paise})=>({slug,title,price_paise}));
  return Response.json({enabled:true,keyId:process.env.RAZORPAY_KEY_ID,courses},{headers:{"Cache-Control":"public, max-age=60"}});
}
