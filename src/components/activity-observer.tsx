'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendActivity } from '@/lib/insights/client';
export function ActivityObserver() {
  const pathname=usePathname();
  useEffect(()=>{
    if(pathname.startsWith('/admin'))return;
    let lastInteraction=Date.now();
    const touch=()=>{lastInteraction=Date.now();};
    const send=(kind:'PAGE_VIEW'|'HEARTBEAT')=>{if(document.visibilityState==='visible'&&Date.now()-lastInteraction<300_000)sendActivity(kind);};
    send('PAGE_VIEW');const timer=setInterval(()=>send('HEARTBEAT'),60_000);
    const visible=()=>{if(document.visibilityState==='visible'){touch();send('HEARTBEAT');}};
    window.addEventListener('pointerdown',touch);window.addEventListener('keydown',touch);window.addEventListener('scroll',touch,{passive:true});document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);window.removeEventListener('pointerdown',touch);window.removeEventListener('keydown',touch);window.removeEventListener('scroll',touch);document.removeEventListener('visibilitychange',visible);};
  },[pathname]);
  return null;
}
