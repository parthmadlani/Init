"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
export function OwnerRefresh() {
  const router=useRouter(),[pending,start]=useTransition();
  useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')router.refresh();},60_000);return()=>clearInterval(timer);},[router]);
  return <button type="button" onClick={()=>start(()=>router.refresh())} disabled={pending} className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium">{pending?'Refreshing…':'Refresh insights'}</button>;
}
