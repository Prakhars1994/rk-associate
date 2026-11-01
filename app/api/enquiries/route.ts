import {notifyOffice,parseEnquiry,saveEnquiry} from "@/lib/server/enquiries";

export async function POST(req:Request){
  let body:unknown;
  try{body=await req.json()}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400})}
  // Honeypot: real users never fill the hidden "website" field.
  if(body&&typeof body==="object"&&(body as {fields?:Record<string,unknown>}).fields?.website)return Response.json({ok:true});
  const parsed=parseEnquiry(body);
  if(!parsed.ok)return Response.json(parsed,{status:400});
  const e={...parsed.enquiry,user_agent:req.headers.get("user-agent")?.slice(0,300)||undefined};
  try{
    const id=await saveEnquiry(e);
    try{await notifyOffice(e,id)}catch(err){console.error("Enquiry notify error",err)}
    return Response.json({ok:true,id},{status:201});
  }catch(err){
    console.error("Enquiry save error",err);
    return Response.json({ok:false,error:"Could not save enquiry"},{status:500});
  }
}
