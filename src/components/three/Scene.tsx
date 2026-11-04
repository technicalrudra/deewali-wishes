'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

class SceneBoundary extends Component<{children:ReactNode;lit:boolean},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}render(){return this.state.failed?<Fallback lit={this.props.lit}/>:this.props.children;}}
export default function Scene({lit,reduced}:{lit:boolean;reduced:boolean}){
 const [visible,setVisible]=useState(true),[supported,setSupported]=useState<boolean|null>(null);
 useEffect(()=>{try{const c=document.createElement('canvas');const gl=c.getContext('webgl2');setSupported(!!gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{setSupported(false);}const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 if(supported===null)return <div className="scene-loading"><span/>Gathering the light…</div>;
 if(!supported)return <Fallback lit={lit}/>;
 return <SceneBoundary lit={lit}><Canvas dpr={[1,1.5]} camera={{position:[0,2.7,6.8],fov:35}} frameloop={visible&&!reduced?'always':'demand'} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} style={{position:'absolute',inset:0}} aria-hidden="true">
  <ambientLight intensity={lit?.5:.32}/><directionalLight position={[-3,5,2]} intensity={lit?2:1.1} color="#f5d7a0"/>
  <Environment resolution={64} frames={1}><Lightformer intensity={2.5} color="#ffdf9b" position={[-3,4,2]} scale={[2,5,1]} target={[0,0,0]}/><Lightformer intensity={1} color="#b18bce" position={[4,2,1]} scale={[2,4,1]} target={[0,0,0]}/></Environment>
  <Diya lit={lit} reduced={reduced}/>
  {!reduced&&<Sparkles count={lit?65:20} scale={[6,3.5,3]} position={[0,.9,-1]} size={1.5} speed={.2} color="#ffcf78" opacity={lit?.7:.25}/>}
 </Canvas></SceneBoundary>;
}
function Diya({lit,reduced}:{lit:boolean;reduced:boolean}){
 const group=useRef<THREE.Group>(null),flame=useRef<THREE.Group>(null),light=useRef<THREE.PointLight>(null);
 const bowl=useMemo(()=>new THREE.LatheGeometry([new THREE.Vector2(.03,-.5),new THREE.Vector2(.3,-.48),new THREE.Vector2(.62,-.36),new THREE.Vector2(.95,-.13),new THREE.Vector2(1.18,.16),new THREE.Vector2(1.22,.28),new THREE.Vector2(1.15,.31),new THREE.Vector2(1.08,.19),new THREE.Vector2(.9,-.04),new THREE.Vector2(.58,-.24),new THREE.Vector2(.2,-.3),new THREE.Vector2(.03,-.3)],80),[]);
 const flameGeo=useMemo(()=>new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.08,.03),new THREE.Vector2(.13,.16),new THREE.Vector2(.1,.3),new THREE.Vector2(.055,.44),new THREE.Vector2(.025,.55),new THREE.Vector2(0,.68)],32),[]);
 useEffect(()=>()=>{bowl.dispose();flameGeo.dispose();},[bowl,flameGeo]);
 useEffect(()=>{if(!lit)return;if(flame.current&&!reduced){const tween=gsap.fromTo(flame.current.scale,{x:0,y:0,z:0},{x:1,y:1,z:1,duration:1.3,ease:'power2.out'});return()=>{tween.kill();};}},[lit,reduced]);
 useFrame(({clock})=>{if(reduced)return;const t=clock.elapsedTime;if(group.current){group.current.position.y=Math.sin(t*.7)*.035-.15;group.current.rotation.y=Math.sin(t*.28)*.08-.25;}if(flame.current){flame.current.rotation.z=Math.sin(t*5)*.055;flame.current.scale.y=1+Math.sin(t*10)*.04;}if(light.current)light.current.intensity=2.7+Math.sin(t*9)*.2;});
 const brass=<meshStandardMaterial color="#b9812d" metalness={.91} roughness={.26}/>;
 return <group ref={group} rotation={[.16,-.25,-.03]} position={[0,-.15,0]} scale={1.27}>
  <mesh geometry={bowl} scale={[1,1, .82]}>{brass}</mesh>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,.275,0]} scale={[1,.82,1]}><torusGeometry args={[1.183,.043,12,100]}/>{brass}</mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.08,0]} scale={[1,.82,1]}><circleGeometry args={[1.05,64]}/><meshStandardMaterial color="#44230b" metalness={.5} roughness={.18}/></mesh>
  <mesh position={[0,-.53,0]}><cylinderGeometry args={[.32,.5,.12,48]}/>{brass}</mesh>
  <mesh position={[0,-.62,0]}><cylinderGeometry args={[.5,.58,.09,48]}/>{brass}</mesh>
  {Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*1.13,.205,Math.sin(a)*.925]} scale={[.027,.045,.027]}><sphereGeometry args={[1,6,6]}/>{brass}</mesh>;})}
  <mesh position={[.02,.21,.78]} rotation={[.6,0,-.1]}><capsuleGeometry args={[.042,.27,4,8]}/><meshStandardMaterial color={lit?'#242015':'#bca982'} roughness={1}/></mesh>
  {lit&&<><group ref={flame} position={[0,.35,.87]}><mesh geometry={flameGeo}><meshBasicMaterial color="#ff981b" transparent opacity={.7} depthWrite={false}/></mesh><mesh geometry={flameGeo} scale={[.6,.8,.6]} position={[0,.02,.015]}><meshBasicMaterial color="#ffe29a"/></mesh><mesh geometry={flameGeo} scale={[.28,.55,.28]} position={[0,.025,.035]}><meshBasicMaterial color="#fffbe8"/></mesh><mesh><sphereGeometry args={[.3,16,12]}/><meshBasicMaterial color="#ff9810" transparent opacity={.035} depthWrite={false}/></mesh></group><pointLight ref={light} position={[0,.8,.8]} color="#ff9c32" intensity={2.8} distance={6} decay={2}/></>}
 </group>;
}
function Fallback({lit}:{lit:boolean}){return <div className={`fallback-diya ${lit?'lit':''}`} aria-hidden="true"><div className="fallback-flame"/><div className="fallback-wick"/><div className="fallback-bowl"/><div className="fallback-foot"/></div>;}
