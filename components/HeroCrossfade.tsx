"use client";
import {useEffect,useState} from "react";
export function HeroCrossfade({images}:{images:string[]}){
 const [active,setActive]=useState(0);const [reduce,setReduce]=useState(false);
 useEffect(()=>{const m=window.matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setReduce(m.matches);sync();m.addEventListener?.("change",sync);return()=>m.removeEventListener?.("change",sync)},[]);
 useEffect(()=>{if(reduce||images.length<2)return;const id=window.setInterval(()=>setActive(v=>(v+1)%images.length),3000);return()=>window.clearInterval(id)},[images.length,reduce]);
 return <div className="heroCrossfade" aria-hidden="true">{images.map((src,i)=><img key={src} src={src} className={i===active?"active":""} alt="" loading={i===0?"eager":"lazy"} decoding="async"/>)}</div>
}