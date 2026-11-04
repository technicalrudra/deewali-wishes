'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useAudio(){
 const [enabled,setEnabled]=useState(false);const ctx=useRef<AudioContext|null>(null);const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 const tone=useCallback((notes:number[],volume=.045)=>{try{const c=ctx.current??(ctx.current=new AudioContext());void c.resume();notes.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;const t=c.currentTime+i*.17;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+2);});}catch{/* Sound is optional. */}},[]);
 useEffect(()=>{if(enabled){tone([261.63,392,523.25],.018);timer.current=setInterval(()=>{if(!document.hidden)tone([261.63,329.63,392,523.25],.018);},6000);}return()=>{if(timer.current)clearInterval(timer.current);};},[enabled,tone]);
 useEffect(()=>{const visibility=()=>{if(document.hidden)void ctx.current?.suspend();else if(enabled)void ctx.current?.resume();};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[enabled]);
 useEffect(()=>()=>{void ctx.current?.close();},[]);
 return {enabled,toggle:()=>{if(enabled)void ctx.current?.suspend();setEnabled(v=>!v);},chime:()=>{if(enabled)tone([523.25,659.25,783.99,1046.5]);}};
}
