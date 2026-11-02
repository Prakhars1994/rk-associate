"use client";
import {FormEvent,useEffect,useState} from "react";
import {adminSignIn,readAdminSession} from "@/lib/studentApi";

// /admin/login: staff-only sign-in, separate from the student /login (no sign-up, no student session).
export function AdminLogin(){
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(readAdminSession())location.replace("/admin")},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");setBusy(true);
    const f=new FormData(e.currentTarget);
    const r=await adminSignIn(String(f.get("email")),String(f.get("password")));
    if(r.session){location.assign("/admin");return}
    setBusy(false);setMsg(r.message||"");
  }

  return <section className="section studentAuth adminAuth">
    <div className="formPanel">
      <span className="eyebrow">RK ASSOCIATE · STAFF ONLY</span>
      <h1>Admin login</h1>
      <p>For RK Associate office staff. Students should use the <a href="/login">student login</a>.</p>
      <form className="form" onSubmit={submit}>
        <input name="email" type="email" placeholder="Admin email" autoComplete="username" required maxLength={255}/>
        <input name="password" type="password" placeholder="Password" autoComplete="current-password" required maxLength={72}/>
        <button className="btn" type="submit" disabled={busy}>{busy?"Checking…":"Log in to admin"}</button>
      </form>
      {msg&&<p className="payNote" role="alert">{msg}</p>}
    </div>
  </section>;
}
