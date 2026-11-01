"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {API,apiCall,explain,readSession,saveSession,signOut,type Session} from "@/lib/studentApi";

type Enrollment={id:string;status:string;payment_status:string;progress_pct:number;enrolled_at:string;completed_at:string|null;course:{slug:string;title:string;duration_days:number|null;mode:string|null}};

const statusLabel=(e:Enrollment)=>e.payment_status!=="paid"?"Payment pending":e.status==="completed"?"Completed":"Enrolled";

// /my-courses: the signed-in student's enrolments, progress and certificates.
export function MyCourses(){
  const [session,setSession]=useState<Session|null|undefined>(undefined);
  const [items,setItems]=useState<Enrollment[]|null>(null);
  const [msg,setMsg]=useState("");
  const [busyId,setBusyId]=useState("");

  useEffect(()=>{
    const s=readSession();setSession(s);
    if(!s)return;
    apiCall("/me/enrollments",{token:s.access_token}).then(({status,data})=>{
      if(status===401){saveSession(null);setSession(null);return}
      if(status!==200){setMsg(explain(data.error));setItems([]);return}
      setItems(data.enrollments as Enrollment[]);
    });
  },[]);

  async function certificate(e:Enrollment){
    if(!session)return;
    setBusyId(e.id);setMsg("");
    try{
      const {status,data}=await apiCall(`/me/enrollments/${e.id}/certificate`,{body:{},token:session.access_token});
      if(status!==201){setMsg(explain(data.error));return}
      const res=await fetch(`${API}${data.certificate.download.replace(/^\/api/,"")}`,{headers:{Authorization:`Bearer ${session.access_token}`}});
      if(!res.ok){setMsg(explain());return}
      const url=URL.createObjectURL(await res.blob());
      const a=document.createElement("a");a.href=url;a.download=`RK-certificate-${data.certificate.code}.pdf`;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
    }finally{setBusyId("")}
  }

  if(session===undefined)return <section className="section"><p>Loading…</p></section>;
  if(!session)return <section className="section studentAuth"><div className="formPanel"><span className="eyebrow">MY COURSES</span><h1>Please log in</h1><p>Log in to see your courses, payments and certificates.</p><Link className="btn" href="/login?next=/my-courses">Log in</Link></div></section>;

  return <section className="section myCourses">
    <div className="sectionHead">
      <span className="eyebrow">MY COURSES</span>
      <h1>Welcome{session.name?`, ${session.name}`:""}</h1>
      <p>Signed in as {session.email}. <button type="button" className="payCancel" onClick={async()=>{await signOut();location.assign("/login")}}>Log out</button></p>
    </div>
    {msg&&<p className="payNote" role="alert">{msg}</p>}
    {items===null?<p>Loading your courses…</p>:items.length===0?<div className="card"><h3>No courses yet</h3><p>Choose a practical HR program to get started.</p><Link className="btn" href="/courses">Browse courses</Link></div>:
    <div className="grid courseGrid">{items.map(e=><article className="card" key={e.id}>
      <span className="eyebrow">{statusLabel(e)}</span>
      <h3>{e.course.title}</h3>
      <p>{[e.course.mode,e.course.duration_days?`${e.course.duration_days} days`:null].filter(Boolean).join(" · ")}</p>
      {e.payment_status==="paid"&&<div className="progressBar" role="progressbar" aria-valuenow={Math.round(e.progress_pct)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${Math.min(100,e.progress_pct)}%`}}/></div>}
      {e.payment_status==="paid"&&<p>{Math.round(e.progress_pct)}% complete · Enrolled {new Date(e.enrolled_at).toLocaleDateString("en-IN")}</p>}
      <div className="cardActions">
        {e.payment_status!=="paid"&&<Link className="btn" href={`/courses`}>Complete payment</Link>}
        {e.status==="completed"&&<button type="button" className="btn" disabled={busyId===e.id} onClick={()=>certificate(e)}>{busyId===e.id?"Preparing…":"Download certificate"}</button>}
        <a href={"https://wa.me/919685688099?text="+encodeURIComponent("Hello RK Associate, I have a question about my course: "+e.course.title)} target="_blank" rel="noreferrer">Ask on WhatsApp →</a>
      </div>
    </article>)}</div>}
  </section>;
}
