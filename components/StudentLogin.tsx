"use client";
import {FormEvent,useEffect,useState} from "react";
import {apiCall,explain,readSession,signIn} from "@/lib/studentApi";

type Mode="login"|"register"|"forgot"|"reset";

// /login: log in, create an account, request a reset link, or set a new password from the reset email.
export function StudentLogin(){
  const [mode,setMode]=useState<Mode>("login");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const [recoveryToken,setRecoveryToken]=useState("");

  useEffect(()=>{
    const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.slice(1));
    if(h.get("type")==="recovery"&&h.get("access_token")){setRecoveryToken(h.get("access_token")!);setMode("reset");history.replaceState(null,"",location.pathname);return}
    if(h.get("error_description"))setMsg(h.get("error_description")!.replace(/\+/g," ")+". Request a new link below.");
    if(q.get("confirmed"))setMsg("Email confirmed. Log in below to continue.");
    if(location.hash==="#forgot")setMode("forgot");
    if(readSession()&&!q.get("confirmed"))location.replace(nextUrl());
  },[]);

  const nextUrl=()=>{const n=new URLSearchParams(location.search).get("next");return n&&n.startsWith("/")&&!n.startsWith("//")?n:"/my-courses"};
  const go=(m:Mode)=>{setMode(m);setMsg("")};

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg("");setBusy(true);
    const f=Object.fromEntries(new FormData(e.currentTarget)) as Record<string,string>;
    try{
      if(mode==="login"||mode==="register"){
        const r=await signIn(mode,{email:f.email,password:f.password,name:f.name,phone:f.phone});
        if(r.session){location.assign(nextUrl());return}
        if(r.needsConfirmation)setMode("login");
        setMsg(r.message||explain());
      }else if(mode==="forgot"){
        await apiCall("/auth/forgot-password",{body:{email:f.email.trim().toLowerCase()}});
        setMsg("If an account exists for that email, we've sent a password reset link. Check your inbox.");
      }else{
        if(f.password!==f.confirm){setMsg("The two passwords don't match.");return}
        const {status,data}=await apiCall("/auth/reset-password",{body:{access_token:recoveryToken,password:f.password}});
        if(status===200){setRecoveryToken("");setMode("login");setMsg("Password updated. Log in with your new password.")}
        else{if(status===401)setMode("forgot");setMsg(explain(data.error,data.message||explain()))}
      }
    }finally{setBusy(false)}
  }

  const titles:Record<Mode,string>={login:"Student login",register:"Create your student account",forgot:"Reset your password",reset:"Set a new password"};
  return <section className="section studentAuth">
    <div className="formPanel">
      <span className="eyebrow">RK ASSOCIATE · STUDENTS</span>
      <h1>{titles[mode]}</h1>
      {(mode==="login"||mode==="register")&&<div className="payTabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode==="login"} className={mode==="login"?"active":""} onClick={()=>go("login")}>Log in</button>
        <button type="button" role="tab" aria-selected={mode==="register"} className={mode==="register"?"active":""} onClick={()=>go("register")}>New student</button>
      </div>}
      <form className="form" onSubmit={submit}>
        {mode==="register"&&<input name="name" placeholder="Full name" autoComplete="name" required minLength={2} maxLength={120}/>}
        {mode!=="reset"&&<input name="email" type="email" placeholder="Email" autoComplete="email" required maxLength={255}/>}
        {mode==="register"&&<input name="phone" inputMode="tel" placeholder="Mobile" autoComplete="tel" pattern="[0-9+\- ]{7,20}"/>}
        {mode!=="forgot"&&<input name="password" type="password" placeholder={mode==="login"?"Password":"New password (min 8 characters)"} autoComplete={mode==="login"?"current-password":"new-password"} required minLength={mode==="login"?1:8} maxLength={72}/>}
        {mode==="reset"&&<input name="confirm" type="password" placeholder="Repeat new password" autoComplete="new-password" required minLength={8} maxLength={72}/>}
        <button className="btn" type="submit" disabled={busy}>{busy?"Please wait…":{login:"Log in",register:"Create account",forgot:"Send reset link",reset:"Save new password"}[mode]}</button>
      </form>
      {msg&&<p className="payNote" role="status">{msg}</p>}
      <p className="authLinks">
        {mode==="login"&&<button type="button" className="payCancel" onClick={()=>go("forgot")}>Forgot password?</button>}
        {(mode==="forgot"||mode==="reset")&&<button type="button" className="payCancel" onClick={()=>go("login")}>Back to login</button>}
      </p>
    </div>
  </section>;
}
