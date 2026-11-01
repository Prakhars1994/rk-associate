// Best-effort office email via SendGrid. Silently skipped until SENDGRID_API_KEY, ENQUIRY_NOTIFY_EMAIL and ENQUIRY_FROM_EMAIL are set.

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));

export async function emailOffice(subject:string,fields:Record<string,unknown>,opts:{replyTo?:{email:string;name?:string};footer?:string}={}):Promise<void>{
  const key=process.env.SENDGRID_API_KEY,to=process.env.ENQUIRY_NOTIFY_EMAIL,from=process.env.ENQUIRY_FROM_EMAIL;
  if(!key||!to||!from)return;
  const rows=Object.entries(fields).filter(([,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=>`<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k.replace(/_/g," "))}</td><td style="padding:4px 0">${esc(String(v))}</td></tr>`).join("");
  const res=await fetch("https://api.sendgrid.com/v3/mail/send",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({
    personalizations:[{to:to.split(",").map(x=>({email:x.trim()}))}],
    from:{email:from,name:"RK Associate Website"},
    ...(opts.replyTo?{reply_to:opts.replyTo}:{}),
    subject,
    content:[{type:"text/html",value:`<h2 style="font-family:sans-serif">${esc(subject)}</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table>${opts.footer?`<p style="font-family:sans-serif;color:#999;font-size:12px">${esc(opts.footer)}</p>`:""}`}]
  })});
  if(!res.ok)console.error("SendGrid send failed",res.status,await res.text());
}
