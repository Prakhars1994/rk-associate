"use client";
import {useEffect,useState} from "react";
type Slide={image:string;kicker:string;title:string;text:string};
export function PremiumSlider({slides,variant="cinematic"}:{slides:Slide[];variant?:string}){
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[reduce,setReduce]=useState(false);
 useEffect(()=>{const m=window.matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setReduce(m.matches);sync();m.addEventListener?.("change",sync);return()=>m.removeEventListener?.("change",sync)},[]);
 useEffect(()=>{if(paused||reduce||slides.length<2)return;const id=window.setInterval(()=>setActive(v=>(v+1)%slides.length),5200);return()=>window.clearInterval(id)},[paused,reduce,slides.length]);
 const move=(n:number)=>setActive(v=>(v+n+slides.length)%slides.length);
 return <section className={"premiumSlider "+variant} aria-roledescription="carousel" aria-label="Featured highlights" tabIndex={0} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onKeyDown={e=>{if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1)}}>
  <div className="sliderViewport">{slides.map((s,i)=><article className={"slide "+(i===active?"active":"")} key={s.title} aria-hidden={i!==active}><img src={s.image} alt="" loading={i===0?"eager":"lazy"} decoding="async"/><div className="slideShade"/><div className="slideCopy"><span className="eyebrow">{s.kicker}</span><h2>{s.title}</h2><p>{s.text}</p></div></article>)}</div>
  <button className="slideArrow prev" onClick={()=>move(-1)} aria-label="Previous slide">‹</button><button className="slideArrow next" onClick={()=>move(1)} aria-label="Next slide">›</button>
  <div className="slideDots">{slides.map((s,i)=><button key={s.title} className={i===active?"active":""} onClick={()=>setActive(i)} aria-label={"Show slide "+(i+1)}/>)}</div>
  {!reduce&&<button className="slidePause" onClick={()=>setPaused(v=>!v)} aria-label={paused?"Play slideshow":"Pause slideshow"}>{paused?"Play":"Pause"}</button>}
 </section>
}
