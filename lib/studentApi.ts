// Browser-side helpers for the rk-associate-api Worker (Supabase accounts, enrolments, payments, certificates).
// The session (bearer token) is kept in sessionStorage, so it ends when the tab closes.

export const API=process.env.NEXT_PUBLIC_API_URL||"https://rk-associate-api.vliab.workers.dev/api";
const SESSION_KEY="rk_api_session";

export type Session={access_token:string;expires_at:number;email:string;name?:string;phone?:string};

export function readSession():Session|null{try{const s=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null") as Session|null;return s&&s.expires_at*1000>Date.now()+60000?s:null}catch{return null}}
export function saveSession(s:Session|null){try{s?sessionStorage.setItem(SESSION_KEY,JSON.stringify(s)):sessionStorage.removeItem(SESSION_KEY)}catch{}}

export async function apiCall(path:string,{body,token,method}:{body?:unknown;token?:string;method?:string}={}){
  const res=await fetch(`${API}${path}`,{method:method||(body===undefined?"GET":"POST"),headers:{...(body!==undefined?{"Content-Type":"application/json"}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)}).catch(()=>null);
  if(!res)return {status:0,data:{} as Record<string,any>};
  return {status:res.status,data:await res.json().catch(()=>({})) as Record<string,any>};
}

const errorText:Record<string,string>={invalid_credentials:"Email or password is incorrect.",user_already_exists:"An account with this email already exists. Log in instead.",weak_password:"Please choose a stronger password (at least 8 characters).",already_enrolled:"You are already enrolled in this course. Our team will contact you with batch details.",payments_not_configured:"Online payment is not available right now. Please WhatsApp us to enroll.",too_many_requests:"Too many attempts. Please wait a minute and try again.",reset_link_expired:"This reset link has expired. Request a new one below.",course_not_completed:"The certificate is available once you complete the course.",invalid_input:"Please check the details you entered.",email_not_confirmed:"Please confirm your email first - open the link we emailed you, then log in."};
export const explain=(code?:string,fallback="Something went wrong. Please try again.")=>(code&&errorText[code])||fallback;

// Logs in or registers. Returns the new session, or a message to show (e.g. "confirm your email").
export async function signIn(mode:"login"|"register",f:{email:string;password:string;name?:string;phone?:string}):Promise<{session?:Session;message?:string;needsConfirmation?:boolean}>{
  const email=f.email.trim().toLowerCase();
  const {status,data}=mode==="register"
    ?await apiCall("/auth/register",{body:{email,password:f.password,full_name:(f.name||"").trim(),...(f.phone?.trim()?{phone:f.phone.trim()}:{})}})
    :await apiCall("/auth/login",{body:{email,password:f.password}});
  if((status===200||status===201)&&data.access_token){
    const session:Session={access_token:data.access_token,expires_at:data.expires_at,email,name:f.name?.trim(),phone:f.phone?.trim()};
    saveSession(session);
    return {session};
  }
  if(status===201&&data.needs_confirmation)return {needsConfirmation:true,message:`Account created. We've emailed a confirmation link to ${email} - open it, then log in.`};
  if(status===429)return {message:explain("too_many_requests")};
  if(status===0)return {message:"Could not reach the server. Check your internet connection and try again."};
  return {message:explain(data.error,data.message||explain())};
}

export async function signOut(){const s=readSession();saveSession(null);await apiCall("/auth/logout",{body:{},token:s?.access_token})}
