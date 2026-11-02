"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {API,apiCall,explain,readSession,saveSession,signOut,type Session} from "@/lib/studentApi";

// /admin: office view of enquiries, payments, enrolments and students (rk-associate-api /admin/*, admin role only).
type Tab="enquiries"|"payments"|"enrollments"|"users";
type Row=Record<string,any>;
type Stats={users:number;paid_enrollments:number;open_tickets:number;revenue_paise:number;new_enquiries?:number};

const rupees=(p:number)=>`₹${(p/100).toLocaleString("en-IN")}`;
const when=(s:string)=>new Date(s).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
const ENQUIRY_STATUSES=["new","contacted","converted","closed"];

const columns:Record<Tab,{label:string;get:(r:Row)=>React.ReactNode}[]>={
  enquiries:[
    {label:"Received",get:r=>when(r.created_at)},
    {label:"Type",get:r=>r.kind},
    {label:"Name",get:r=><>{r.name}{r.company?<small><br/>{r.company}</small>:null}</>},
    {label:"Contact",get:r=><><a href={`tel:${r.mobile}`}>{r.mobile}</a>{r.email?<><br/><a href={`mailto:${r.email}`}>{r.email}</a></>:null}</>},
    {label:"Interested in",get:r=>[r.service,r.course,r.experience,r.employee_count&&`${r.employee_count} employees`,r.preferred_batch].filter(Boolean).join(" · ")},
    {label:"Message",get:r=>r.message||""},
  ],
  payments:[
    {label:"Date",get:r=>when(r.created_at)},
    {label:"Student",get:r=><>{r.user?.full_name}<small><br/>{r.user?.email}</small></>},
    {label:"Amount",get:r=>rupees(r.amount_paise)},
    {label:"Status",get:r=>r.status},
    {label:"Method",get:r=>r.method||""},
    {label:"Razorpay payment",get:r=>r.razorpay_payment_id||r.razorpay_order_id||""},
  ],
  enrollments:[
    {label:"Enrolled",get:r=>when(r.enrolled_at)},
    {label:"Student",get:r=><>{r.user?.full_name}<small><br/>{r.user?.email}</small></>},
    {label:"Course",get:r=>r.course?.title},
    {label:"Payment",get:r=>r.payment_status},
    {label:"Status",get:r=>r.status},
    {label:"Progress",get:r=>`${Math.round(r.progress_pct)}%`},
  ],
  users:[
    {label:"Joined",get:r=>when(r.created_at)},
    {label:"Name",get:r=>r.full_name},
    {label:"Email",get:r=><a href={`mailto:${r.email}`}>{r.email}</a>},
    {label:"Phone",get:r=>r.phone||""},
    {label:"Role",get:r=>r.role},
    {label:"Last login",get:r=>r.last_login_at?when(r.last_login_at):"—"},
  ],
};

export function AdminDashboard(){
  const [session,setSession]=useState<Session|null|undefined>(undefined);
  const [denied,setDenied]=useState(false);
  const [stats,setStats]=useState<Stats|null>(null);
  const [tab,setTab]=useState<Tab>("enquiries");
  const [rows,setRows]=useState<Row[]|null>(null);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [msg,setMsg]=useState("");
  const perPage=50;

  const guard=useCallback((status:number)=>{if(status===401){saveSession(null);setSession(null);return true}if(status===403){setDenied(true);return true}return false},[]);

  useEffect(()=>{const s=readSession();setSession(s);if(!s)return;apiCall("/admin/stats",{token:s.access_token}).then(({status,data})=>{if(!guard(status))setStats(data as Stats)})},[guard]);

  useEffect(()=>{
    if(!session||denied)return;
    setRows(null);setMsg("");
    apiCall(`/admin/${tab}?page=${page}&per_page=${perPage}`,{token:session.access_token}).then(({status,data})=>{
      if(guard(status))return;
      if(status!==200){setMsg(explain(data.error));setRows([]);return}
      setRows(data[tab]||[]);setTotal(data.total||0);
    });
  },[session,tab,page,denied,guard]);

  async function setEnquiryStatus(id:string,status:string){
    if(!session)return;
    const {status:code,data}=await apiCall(`/admin/enquiries/${id}`,{method:"PATCH",body:{status},token:session.access_token});
    if(guard(code))return;
    if(code!==200){setMsg(explain(data.error));return}
    setRows(rs=>rs&&rs.map(r=>r.id===id?{...r,status}:r));
    setStats(s=>s&&s.new_enquiries!==undefined?{...s,new_enquiries:s.new_enquiries+(status==="new"?1:0)-(rows?.find(r=>r.id===id)?.status==="new"?1:0)}:s);
  }

  async function downloadCsv(){
    if(!session)return;
    const res=await fetch(`${API}/admin/${tab}?page=${page}&per_page=200&format=csv`,{headers:{Authorization:`Bearer ${session.access_token}`}});
    if(!res.ok){setMsg(explain());return}
    const url=URL.createObjectURL(await res.blob());
    const a=document.createElement("a");a.href=url;a.download=`rk-${tab}-${new Date().toISOString().slice(0,10)}.csv`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }

  if(session===undefined)return <section className="section"><p>Loading…</p></section>;
  if(!session)return <section className="section studentAuth"><div className="formPanel"><span className="eyebrow">ADMIN</span><h1>Please log in</h1><p>Log in with an admin account to see enquiries, payments and students.</p><Link className="btn" href="/login?next=/admin">Log in</Link></div></section>;
  if(denied)return <section className="section studentAuth"><div className="formPanel"><span className="eyebrow">ADMIN</span><h1>No admin access</h1><p>{session.email} is not an admin account. Ask RK Associate to give this account admin access.</p><button type="button" className="payCancel" onClick={async()=>{await signOut();location.assign("/login?next=/admin")}}>Log in with a different account</button></div></section>;

  const tiles:[string,string|number|undefined][]=[["New enquiries",stats?.new_enquiries],["Revenue",stats?rupees(stats.revenue_paise):undefined],["Paid enrolments",stats?.paid_enrollments],["Students",stats?.users],["Open tickets",stats?.open_tickets]];
  const pages=Math.max(1,Math.ceil(total/perPage));
  return <section className="section adminDash">
    <div className="sectionHead"><span className="eyebrow">ADMIN</span><h1>RK Associate dashboard</h1><p>Signed in as {session.email}. <button type="button" className="payCancel" onClick={async()=>{await signOut();location.assign("/login")}}>Log out</button></p></div>
    <div className="adminTiles">{tiles.map(([k,v])=><div className="card" key={k}><span className="eyebrow">{k}</span><b>{v??"…"}</b></div>)}</div>
    <div className="payTabs adminTabs" role="tablist">{(["enquiries","payments","enrollments","users"] as Tab[]).map(t=><button key={t} type="button" role="tab" aria-selected={tab===t} className={tab===t?"active":""} onClick={()=>{setTab(t);setPage(1)}}>{{enquiries:"Enquiries",payments:"Payments",enrollments:"Enrolments",users:"Students"}[t]}</button>)}</div>
    <div className="adminBar"><span>{rows?`${total} total`:"Loading…"}</span><button type="button" className="payCancel" onClick={downloadCsv} disabled={!rows?.length}>Download CSV</button></div>
    {msg&&<p className="payNote" role="alert">{msg}</p>}
    <div className="adminTableWrap"><table className="adminTable">
      <thead><tr>{columns[tab].map(c=><th key={c.label}>{c.label}</th>)}{tab==="enquiries"&&<th>Status</th>}</tr></thead>
      <tbody>{rows?.length===0?<tr><td colSpan={7}>Nothing here yet.</td></tr>:rows?.map(r=><tr key={r.id}>{columns[tab].map(c=><td key={c.label}>{c.get(r)}</td>)}{tab==="enquiries"&&<td><select aria-label="Enquiry status" value={r.status} onChange={e=>setEnquiryStatus(r.id,e.target.value)}>{ENQUIRY_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></td>}</tr>)}</tbody>
    </table></div>
    {pages>1&&<div className="adminBar"><button type="button" className="payCancel" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Newer</button><span>Page {page} of {pages}</span><button type="button" className="payCancel" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Older →</button></div>}
  </section>;
}
