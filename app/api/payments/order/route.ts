import {createOrder,paymentsEnabled} from "@/lib/server/payments";

export async function POST(req:Request){
  if(!paymentsEnabled())return Response.json({ok:false,error:"Online payment is not available yet"},{status:503});
  let body:{course_slug?:unknown};
  try{body=await req.json()}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400})}
  if(typeof body.course_slug!=="string"||!/^[a-z0-9-]{1,60}$/.test(body.course_slug))return Response.json({ok:false,error:"Invalid course"},{status:400});
  const r=await createOrder(body.course_slug);
  if(!r.ok)return Response.json({ok:false,error:r.error},{status:r.status});
  return Response.json(r,{status:201});
}
