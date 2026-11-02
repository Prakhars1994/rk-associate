"use client";
import {useEffect} from "react";

// Links copied from chats often pick up trailing punctuation ("/login)" or "/courses."), which 404s.
// If removing it gives a different path, retry that path once.
export function FixPastedLink(){
  useEffect(()=>{
    const p=decodeURIComponent(location.pathname);
    const clean=p.replace(/[)\].,;:!?*'"`>\s]+$/,"");
    if(clean&&clean!==p&&!sessionStorage.getItem("fixed:"+p)){sessionStorage.setItem("fixed:"+p,"1");location.replace(clean+location.search+location.hash)}
  },[]);
  return null;
}
