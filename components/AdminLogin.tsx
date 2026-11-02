"use client";
import {FormEvent,useEffect,useState} from "react";
import {adminEnroll,adminPassword,adminVerify,apiCall,readAdminSession,saveAdminSession,type AdminPending} from "@/lib/studentApi";

// /admin/login: staff-only sign-in, separate from the student /login (no sign-up, no student session).
// Password, then a 6-digit code from an authenticator app; first login sets the app up with a QR code.
export function AdminLogin(){
  const [step,setStep]=useState<"password"|"enroll"|"code">("password");
  const [pending,setPending]=useState<AdminPending|null>(null);
  const [setup,setSetup]=useState<{factorId:string;qr?:string;secret?:string}|null>(null);
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(readAdminSession())location.replace("/admin")},[]);

  async function submitPassword(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");setBusy(true);
    const f=new FormData(e.currentTarget);
    const r=await adminPassword(String(f.get("email")),String(f.get("password")));
    if(!r.pending){setBusy(false);setMsg(r.message||"");return}
    setPending(r.pending);
    if(r.pending.factorId){setStep("code");setBusy(false);return}
    const en=await adminEnroll(r.pending);
    setBusy(false);
    // Two-step setup unavailable (e.g. MFA switched off in Supabase): let the admin in on the password alone.
    // Once the API requires two-step for admin routes, such a session gets "mfa_required" and lands back here.
    if(!en.factorId){saveAdminSession({access_token:r.pending.access_token,expires_at:Math.floor(Date.now()/1000)+3000,email:r.pending.email,name:r.pending.name});location.assign("/admin");return}
    setSetup({factorId:en.factorId,qr:en.qr,secret:en.secret});setStep("enroll");
  }

  async function submitCode(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!pending)return;setMsg("");setBusy(true);
    const code=String(new FormData(e.currentTarget).get("code"));
    const factorId=step==="enroll"?setup!.factorId:pending.factorId!;
    const r=await adminVerify(pending,factorId,code);
    if(r.session){location.assign("/admin");return}
    setBusy(false);setMsg(r.message||"");
  }

  // Two-step is optional until the API's ADMIN_REQUIRE_MFA switch is on; this lets an admin in on the password alone.
  function skipSetup(){if(!pending)return;saveAdminSession({access_token:pending.access_token,expires_at:Math.floor(Date.now()/1000)+3000,email:pending.email,name:pending.name});location.assign("/admin")}

  async function cancel(){if(pending)await apiCall("/auth/logout",{body:{},token:pending.access_token});setPending(null);setSetup(null);setStep("password");setMsg("")}

  return <section className="section studentAuth adminAuth">
    <div className="formPanel">
      <span className="eyebrow">RK ASSOCIATE · STAFF ONLY</span>
      {step==="password"&&<>
        <h1>Admin login</h1>
        <p>For RK Associate office staff. Students should use the <a href="/login">student login</a>.</p>
        <form className="form" onSubmit={submitPassword}>
          <input name="email" type="email" placeholder="Admin email" aria-label="Admin email" autoComplete="username" required maxLength={255}/>
          <input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required maxLength={72}/>
          <button className="btn" type="submit" disabled={busy}>{busy?"Checking…":"Continue"}</button>
        </form>
      </>}
      {step==="enroll"&&setup&&<>
        <h1>Set up two-step login</h1>
        <p>Admin accounts need a code from an authenticator app (Google Authenticator, Microsoft Authenticator or Authy). This is a one-time setup.</p>
        <ol className="mfaSteps">
          <li>Open the app and choose <b>Add account → Scan QR code</b>.</li>
          <li>Scan this code:{setup.qr&&<img className="mfaQr" src={setup.qr} alt="QR code for your authenticator app" width={180} height={180}/>}
            {setup.secret&&<small>Can't scan? Enter this key instead: <code>{setup.secret}</code></small>}</li>
          <li>Type the 6-digit code the app shows:</li>
        </ol>
      </>}
      {step==="code"&&<>
        <h1>Enter your code</h1>
        <p>Open your authenticator app and type the current 6-digit code for <b>RK Associate</b>.</p>
      </>}
      {step!=="password"&&<form className="form" onSubmit={submitCode}>
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="6-digit code" aria-label="6-digit code" required autoFocus/>
        <button className="btn" type="submit" disabled={busy}>{busy?"Checking…":step==="enroll"?"Finish setup & log in":"Log in"}</button>
        {step==="enroll"&&<button type="button" className="payCancel" onClick={skipSetup}>Skip for now</button>}<button type="button" className="payCancel" onClick={cancel}>Cancel</button>
      </form>}
      {msg&&<p className="payNote" role="alert">{msg}</p>}
    </div>
  </section>;
}
