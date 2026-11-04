'use client';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, AudioLines, VolumeX, Sparkles, Heart, Share2, Check, ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useDiyaCounter } from '@/hooks/useDiyaCounter';
const Scene = dynamic(()=>import('./three/Scene'),{ssr:false,loading:()=> <div className="scene-loading"><span/>Preparing a little magic…</div>});
const Fireworks = dynamic(()=>import('./three/Fireworks'),{ssr:false});

export default function Experience(){
 const [step,setStep]=useState(0),[name,setName]=useState(''),[error,setError]=useState(''),[lit,setLit]=useState(false),[shared,setShared]=useState(false),[shareError,setShareError]=useState('');
 const {count,counterState,recordLight}=useDiyaCounter(step===2);
 const [celebrating,setCelebrating]=useState(false);
 const fireworksLock=useRef(false);
 const event=useRef<string|null>(null), lock=useRef(false); const audio=useAudio(); const reduced=useReducedMotion();
 const title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(step>0) title.current?.focus();},[step]);
 useEffect(()=>{
  if(!celebrating)return;
  const timer=setTimeout(()=>{fireworksLock.current=false;setCelebrating(false);},reduced?1800:5400);
  return()=>clearTimeout(timer);
 },[celebrating,reduced]);
 function celebrate(){if(fireworksLock.current)return;fireworksLock.current=true;setCelebrating(true);audio.chime();}
 function light(){if(lock.current)return;lock.current=true;event.current=crypto.randomUUID();setLit(true);audio.chime();navigator.vibrate?.(35);void recordLight(event.current);}
 async function share(){setShareError('');const text=`Happy Diwali from ${name}! May your life shine brighter than a thousand diyas. A little light, a little love, a little Diwali magic.`;try{if(navigator.share)await navigator.share({title:'A Little Diwali Magic',text,url:location.href});else {await navigator.clipboard.writeText(`${text}\n${location.href}`);setShared(true);setTimeout(()=>setShared(false),3500);}}catch(e){if((e as Error).name!=='AbortError')setShareError('Sharing is unavailable. Copy the address from your browser to share your light.');}}
 return <main className={`experience step-${step} ${lit?'is-lit':''}`}>
  <div className="grain" aria-hidden="true"/><div className="ambient" aria-hidden="true"/>
  {step===2&&celebrating&&<Fireworks reduced={!!reduced}/>}
  <div className="corner corner-tl" aria-hidden="true"/><div className="corner corner-tr" aria-hidden="true"/><div className="corner corner-bl" aria-hidden="true"/><div className="corner corner-br" aria-hidden="true"/>
  <header><a className="brand" href="/" aria-label="A Little Diwali Magic home"><Floral/><span>a little <em>diwali</em> magic</span></a><button className={`sound ${audio.enabled?'enabled':''}`} onClick={audio.toggle} aria-label={audio.enabled?'Turn music off':'Turn music on'} aria-pressed={audio.enabled}>{audio.enabled?<AudioLines size={17}/>:<VolumeX size={17}/>}<span>SOUND {audio.enabled?'ON':'OFF'}</span></button></header>
  <div className="hanging hanging-left" aria-hidden="true"><Lantern/></div><div className="hanging hanging-right" aria-hidden="true"><Lantern/></div>
  <div className="journey" aria-label={`Step ${step+1} of 3`}><span className={step>=0?'active':''}/><i/><span className={step>=1?'active':''}/><i/><span className={step>=2?'active':''}/></div>
  <AnimatePresence mode="wait"><motion.section key={step} className="screen" initial={{opacity:0,y:reduced?0:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-12}} transition={{duration:reduced?0:.6}}>
   <div className="eyebrow"><span/> {step===0?'A FESTIVAL OF LIGHTS':step===1?'ONE LITTLE LIGHT. ENDLESS POSSIBILITIES.':'LET YOUR HAPPINESS SHINE'} <span/></div>
   <h1 ref={title} tabIndex={-1}>{step===0?<>Something magical<br/><em>awaits you.</em></>:step===1?<>Let’s light up<br/><em>the night.</em></>:<>Happy Diwali,<br/><em>{name}!</em></>}</h1>
   <p className="intro">{step===0?<>A little light. A heartfelt wish.<br/>A celebration made just for you.</>:step===1?<>Every little light brings happiness.<br/>Tap the diya and let the magic begin.</>:<>May your life shine brighter than a thousand diyas,<br className="desktop-break"/> your heart overflow with happiness, and every<br className="desktop-break"/> new beginning bring endless possibilities.</>}</p>
   <div className={`diya-stage ${step===1?'interactive':''}`}>
    <div className="orbit orbit-one" aria-hidden="true"/><div className="orbit orbit-two" aria-hidden="true"/>
    <Scene lit={step===0||lit} reduced={!!reduced}/>
    {step===1&&<button className="light-target" onClick={light} disabled={lit} aria-label={lit?'Diya is lit':'Light the diya'}/>}
    <span className="stage-caption">{step===0?'A LITTLE LIGHT CAN BEGIN SOMETHING BEAUTIFUL':step===1?(lit?'YOUR LIGHT HAS BRIGHTENED THE WORLD':'TAP THE DIYA TO LIGHT IT'):'A LIGHT FOR YOU. A WISH FOR THE WORLD.'}</span>
   </div>
   {step===0?<form className="welcome-form" noValidate onSubmit={e=>{e.preventDefault();const clean=name.trim().replace(/\s+/g,' ');if(clean.length<2||clean.length>40||!/[\p{L}]/u.test(clean)){setError('Please enter a name with 2–40 characters.');return;}setName(clean);setError('');setStep(1);audio.chime();}}>
    <label htmlFor="name">Before we begin, what should we call you?</label><div className={`input-wrap ${error?'invalid':''}`}><Sparkles size={17}/><input id="name" autoComplete="given-name" placeholder="Your lovely name" value={name} maxLength={40} onChange={e=>{setName(e.target.value);setError('');}} aria-invalid={!!error} aria-describedby={error?'name-error':undefined}/></div>
    {error&&<p id="name-error" className="error" role="alert">{error}</p>}
    <button className="primary" type="submit">LET’S CELEBRATE <ArrowRight size={17}/></button><p className="privacy"><Heart size={11}/> Just your first name. A little personal, a lot of magic.</p>
   </form>:step===1?<div className="action-area"><p className="interaction-note" aria-live="polite">{lit?'Make a wish. Let it glow.':'A small gesture. A beautiful beginning.'}</p><button className="primary" disabled={!lit} onClick={()=>setStep(2)}>CONTINUE TO THE MAGIC <ArrowRight size={17}/></button><button className="back" onClick={()=>setStep(0)}><ChevronLeft size={13}/> Back to your name</button></div>:<div className="action-area celebration-actions">
    <button className="primary fireworks-button" onClick={celebrate} disabled={celebrating} aria-describedby="fireworks-hint" aria-busy={celebrating}>
     <Sparkles size={17} aria-hidden="true"/>{celebrating?'CELEBRATING! ✨':'LIGHT UP THE FIREWORKS'}
    </button>
    <p id="fireworks-hint" className="fireworks-hint" role="status">{celebrating?'A little magic, just for you.':'Tap to illuminate the night sky.'}</p>
    <button className="secondary" onClick={share}>{shared?'LINK COPIED':'SHARE THE HAPPINESS'} {shared?<Check size={17}/>:<Share2 size={17}/>}</button>{shareError&&<p role="status" className="error">{shareError}</p>}<div className="counter" aria-live="polite"><div className="counter-label"><Sparkles size={14}/><strong>{count!==null?count.toLocaleString():counterState==='loading'||counterState==='syncing'?'…':'—'}</strong><span>DIYAS LIT</span></div><p>{counterState==='syncing'?'Adding your light to the world…':counterState==='pending'?'Your light is shining. We’re still adding it to the global count.':counterState==='offline'?'Your light is shining. The global count is temporarily unavailable.':"Together, we’re spreading light and happiness!"}</p>{(counterState==='pending'||counterState==='offline')&&<button className="retry" onClick={()=>void recordLight()}>Reconnect your light <ArrowRight size={11}/></button>}</div></div>}
  </motion.section></AnimatePresence>
  <footer><div className="footer-ornament"><span/>✧<span/></div><p>MADE WITH LIGHT & A LITTLE LOVE</p><span className="footer-year">DIWALI · A CELEBRATION OF NEW BEGINNINGS</span></footer>
 </main>;
}
function Floral(){return <svg width="27" height="29" viewBox="0 0 32 32" fill="none" aria-hidden="true">{Array.from({length:8},(_,i)=><ellipse key={i} cx="16" cy="10" rx="3.2" ry="7" stroke="currentColor" strokeWidth=".8" transform={`rotate(${i*45} 16 16)`}/>)}<circle cx="16" cy="16" r="3" fill="currentColor"/></svg>;}
function Lantern(){return <svg viewBox="0 0 100 260" fill="none"><path d="M50 0V105M35 110h30l17 42-17 44H35l-17-44z" stroke="currentColor"/><path d="m35 110 5 42-5 44m30-86-5 42 5 44M18 152h64M50 111v85M34 204h32M40 212v25m10-25v39m10-39v25" stroke="currentColor"/><path d="m50 120 12 32-12 32-12-32z" fill="currentColor" opacity=".18"/><circle cx="50" cy="102" r="3" fill="currentColor"/></svg>;}
