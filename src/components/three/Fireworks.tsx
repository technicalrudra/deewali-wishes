'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';

class FireworksBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <QuietSparkles /> : this.props.children; }
}

export default function Fireworks({ reduced }: { reduced: boolean }) {
  const [visible, setVisible] = useState(true);
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    if (!reduced) {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        setSupported(!!gl);
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch { setSupported(false); }
    }
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [reduced]);

  return <div className="fireworks-layer" aria-hidden="true" data-fireworks="playing">
    {reduced || supported === false ? <QuietSparkles /> : supported &&
      <FireworksBoundary>
        <Canvas camera={{ position: [0, 0, 9], fov: 48 }} dpr={[1, 1.5]}
          frameloop={visible ? 'always' : 'never'}
          gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}>
          <BurstSequence />
        </Canvas>
      </FireworksBoundary>}
  </div>;
}

function BurstSequence() {
  const points = useRef<THREE.Points>(null);
  const elapsed = useRef(0);
  const data = useMemo(() => {
    const bursts = Array.from({ length: 5 }, (_, i) => ({
      delay: i * .63,
      x: (i % 2 ? 1 : -1) * (.45 + Math.random() * .9),
      y: .8 + Math.random() * 2.2,
      z: -1 - Math.random() * 2,
      color: new THREE.Color(['#ffc857', '#ff9f42', '#f9e7bd'][i % 3]),
    }));
    const sparks = 64, trail = 4, perBurst = sparks * trail + 10;
    const count = bursts.length * perBurst;
    const velocities = Array.from({ length: bursts.length * sparks }, () => {
      const theta = Math.random() * Math.PI * 2, z = Math.random() * 2 - 1;
      const radius = Math.sqrt(1 - z * z), speed = .7 + Math.random() * 1.2;
      return new THREE.Vector3(Math.cos(theta) * radius * speed, Math.sin(theta) * radius * speed, z * speed * .5);
    });
    return { bursts, sparks, trail, perBurst, velocities,
      positions: new Float32Array(count * 3), colors: new Float32Array(count * 3),
      alphas: new Float32Array(count), sizes: new Float32Array(count) };
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    elapsed.current += delta;
    for (let b = 0; b < data.bursts.length; b++) {
      const burst = data.bursts[b], local = elapsed.current - burst.delay;
      const place = (index: number, x: number, y: number, z: number, alpha: number, size: number) => {
        const n = b * data.perBurst + index;
        data.positions.set([x, y, z], n * 3);
        data.colors.set([burst.color.r, burst.color.g, burst.color.b], n * 3);
        data.alphas[n] = alpha;
        data.sizes[n] = size;
      };
      for (let s = 0; s < data.sparks; s++) {
        const velocity = data.velocities[b * data.sparks + s];
        for (let tail = 0; tail < data.trail; tail++) {
          const age = local - .7 - tail * .045;
          const live = age >= 0 && age < 2;
          const drag = (1 - Math.exp(-Math.max(age, 0) * .65)) / .65;
          place(s * data.trail + tail,
            burst.x + velocity.x * drag,
            burst.y + velocity.y * drag - .52 * age * age,
            burst.z + velocity.z * drag,
            live ? Math.pow(1 - age / 2, 1.1) * (1 - tail / data.trail) * 1.35 : 0,
            tail === 0 ? 15 : 9);
        }
      }
      for (let tail = 0; tail < 10; tail++) {
        const launch = (local - tail * .016) / .7;
        place(data.sparks * data.trail + tail,
          burst.x - .25 * (1 - launch), -4 + (burst.y + 4) * launch, burst.z,
          launch > 0 && launch < 1 ? (1 - tail / 10) : 0,
          tail === 0 ? 11 : 6);
      }
    }
    for (const name of ['position', 'color', 'alpha', 'size']) points.current.geometry.attributes[name].needsUpdate = true;
  });

  return <points ref={points} frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      <bufferAttribute attach="attributes-alpha" args={[data.alphas, 1]} />
      <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
    </bufferGeometry>
    <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending}
      vertexShader={`attribute float alpha; attribute float size; varying vec3 tint; varying float opacity;
        void main(){ tint=color; opacity=alpha; vec4 view=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*view; gl_PointSize=size*(9.0/-view.z); }`}
      fragmentShader={`varying vec3 tint; varying float opacity;
        void main(){ float radius=length(gl_PointCoord-0.5)*2.0;
        if(radius>1.0) discard; float glow=pow(1.0-radius,1.15);
        gl_FragColor=vec4(mix(tint,vec3(1.0,0.97,0.86),pow(1.0-radius,2.0)*0.85),glow*opacity);
        #include <colorspace_fragment>
        }`}
      vertexColors />
  </points>;
}

function QuietSparkles() {
  return <div className="quiet-fireworks">{Array.from({ length: 18 }, (_, i) =>
    <span key={i} style={{ left: `${8 + (i * 37) % 84}%`, top: `${12 + (i * 23) % 63}%` }}>✧</span>)}
  </div>;
}
