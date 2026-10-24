"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/*
  Full-screen particle hero.
  ~20,000 GPU-animated particles morph between four formations:
    0 galaxy  ->  1 "AI"  ->  2 "OSWELL"  ->  3 torus knot  ->  (loop)
  Particles scatter away from the cursor and settle back. On load they implode from a burst.
  A bloom pass gives the glow. Shapes are generated procedurally / sampled from text, so there are no model files.
*/

export const SHAPES = ["Neural field", "AI", "Oswell", "Knot"];
const NSHAPES = SHAPES.length;

/* ------------------------------------------------------------------ shape generation */

const rand = Math.random;
const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2; // ~[-1, 1], bell shaped

function galaxy(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (rand() < 0.72) {
      const arm = Math.floor(rand() * 3);
      const r = Math.pow(rand(), 0.65) * 3.0 + 0.1;
      const a = r * 1.55 + (arm * Math.PI * 2) / 3 + gauss() * 0.32;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.28 * (1.15 - r / 4);
    } else {
      // soft spherical halo + bright core
      const r = Math.pow(rand(), 1.6) * 3.0;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      x = r * Math.sin(ph) * Math.cos(th);
      y = r * Math.cos(ph) * 0.55;
      z = r * Math.sin(ph) * Math.sin(th);
    }
    // tilt the disc towards the camera so it reads as a glowing spiral rather than an edge-on band
    const th2 = 1.05;
    out[i * 3] = x;
    out[i * 3 + 1] = y * Math.cos(th2) - z * Math.sin(th2);
    out[i * 3 + 2] = y * Math.sin(th2) + z * Math.cos(th2);
  }
  return out;
}

/** Sample points from rendered text so particles can form letters. */
function textShape(n, text, width, weight = 800) {
  const W = 1400, H = 520;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 420;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  const m = ctx.measureText(text).width;
  size = Math.min(420, (size * (W * 0.9)) / m);
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.fillText(text, W / 2, H / 2 + size * 0.04);
  const d = ctx.getImageData(0, 0, W, H).data;
  const px = [];
  let minX = W, maxX = 0;
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (d[(y * W + x) * 4 + 3] > 128) {
        px.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const out = new Float32Array(n * 3);
  const bw = Math.max(maxX - minX, 1);
  const cx = (minX + maxX) / 2;
  const count = px.length / 2;
  for (let i = 0; i < n; i++) {
    if (count === 0) break;
    const k = Math.floor(rand() * count) * 2;
    out[i * 3] = ((px[k] - cx) / bw) * width;
    out[i * 3 + 1] = (-(px[k + 1] - H / 2) / bw) * width;
    out[i * 3 + 2] = gauss() * 0.22;
  }
  return out;
}

function knot(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = rand() * Math.PI * 2;
    const p = 2, q = 3;
    const r = 1.55 + 0.62 * Math.cos(q * t);
    const x = r * Math.cos(p * t);
    const y = r * Math.sin(p * t);
    const z = 0.9 * Math.sin(q * t);
    // tube around the curve
    const a = rand() * Math.PI * 2;
    const rad = 0.22 * Math.sqrt(rand());
    out[i * 3] = x * 1.0 + Math.cos(a) * rad;
    out[i * 3 + 1] = y * 1.0 + Math.sin(a) * rad;
    out[i * 3 + 2] = z * 1.0 + gauss() * 0.12;
  }
  return out;
}

/* ------------------------------------------------------------------ shaders */

const vert = /* glsl */ `
  uniform float uTime; uniform float uShape; uniform float uIntro; uniform float uPx;
  uniform vec3 uMouse; uniform float uMouseOn; uniform vec3 uPal[8];
  attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; attribute vec4 aR;
  varying vec3 vCol; varying float vA;

  vec3 pick(int i) { if (i == 0) return aA; if (i == 1) return aB; if (i == 2) return aC; return aD; }

  void main() {
    float s = mod(uShape, 4.0);
    int i0 = int(floor(s));
    int i1 = int(mod(float(i0) + 1.0, 4.0));
    float f = fract(s);

    // each particle leaves a little later or earlier, so shapes dissolve organically
    float k = clamp((f - aR.x * 0.45) / 0.55, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);

    vec3 p = mix(pick(i0), pick(i1), k);
    float arc = sin(3.14159 * k);
    p += vec3(sin(aR.w * 6.0 + uTime * 2.0), cos(aR.w * 7.0 + uTime * 1.7), sin(aR.w * 5.0 + uTime * 2.3)) * arc * 1.1;

    // idle breathing
    p += vec3(sin(uTime * 0.6 + aR.w * 30.0), cos(uTime * 0.5 + aR.w * 20.0), sin(uTime * 0.7 + aR.w * 10.0)) * 0.03;

    // intro: particles implode from a burst
    float e = 1.0 - uIntro;
    p *= 1.0 + e * e * (2.5 + aR.x * 9.0);

    // cursor repulsion
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float push = exp(-dist * dist * 1.5) * uMouseOn;
    p.xy += normalize(d + vec2(1e-4)) * push * 0.8;
    p.z += push * 0.7 * (aR.x - 0.5);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float tw = 0.65 + 0.35 * sin(uTime * 3.0 + aR.w * 40.0);
    gl_PointSize = aR.y * uPx * tw * (7.5 / -mv.z) * (1.0 + push * 1.6);

    vec3 ca = mix(uPal[i0 * 2], uPal[i0 * 2 + 1], aR.z);
    vec3 cb = mix(uPal[i1 * 2], uPal[i1 * 2 + 1], aR.z);
    vCol = mix(ca, cb, k) * (1.0 + push * 0.8);
    vA = 0.85 + push * 0.4;
  }
`;
const frag = /* glsl */ `
  varying vec3 vCol; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vCol * (1.0 + a * 1.2), a * vA);
  }
`;

// Two colours per shape (galaxy, AI, Oswell, knot)
const PALETTE = ["#19f0c0", "#3fb6ff", "#4f7bff", "#7be9ff", "#3fe6d2", "#9a8cff", "#ff6fd8", "#7b6fff"];

/* ------------------------------------------------------------------ particles */

function Particles({ count, shape, introRef }) {
  const { size, camera } = useThree();
  const px = useThree((s) => s.viewport.dpr);

  const geo = useMemo(() => {
    const A = galaxy(count);
    const B = textShape(count, "AI", 5.0);
    const C = textShape(count, "OSWELL", 6.4);
    const D = knot(count);
    const R = new Float32Array(count * 4);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      R[i * 4] = rand(); // delay
      R[i * 4 + 1] = 2.2 + rand() * 3.4; // size
      R[i * 4 + 2] = rand(); // colour mix
      R[i * 4 + 3] = rand(); // phase
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aA", new THREE.BufferAttribute(A, 3));
    g.setAttribute("aB", new THREE.BufferAttribute(B, 3));
    g.setAttribute("aC", new THREE.BufferAttribute(C, 3));
    g.setAttribute("aD", new THREE.BufferAttribute(D, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(R, 4));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShape: { value: 0 },
      uIntro: { value: 0 },
      uPx: { value: 1 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uMouseOn: { value: 0 },
      uPal: { value: PALETTE.map((c) => { const k = new THREE.Color(c); return new THREE.Vector3(k.r, k.g, k.b); }) },
    }),
    []
  );

  // NOTE: r3f clones a `uniforms` prop, so per-frame updates would never reach the shader.
  // Building the material ourselves keeps `uniforms` the live object.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  const mouseOn = useRef(0);
  const lastPointer = useRef({ x: 0, y: 0 });
  const group = useRef();

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uPx.value = px;

    // ease towards the requested shape; the counter is unbounded so it never rewinds
    uniforms.uShape.value += (shape - uniforms.uShape.value) * (1 - Math.exp(-dt * 1.15));

    const intro = Math.min(t / 2.6, 1);
    uniforms.uIntro.value = 1 - Math.pow(1 - intro, 3);
    if (introRef) introRef.current = intro;

    // cursor in the particle plane (z = 0)
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * (size.width / size.height);
    const g = group.current;
    const lx = pointer.x * halfW - g.position.x;
    const ly = pointer.y * halfH - g.position.y;
    uniforms.uMouse.value.set(lx, ly, 0);
    const moved = Math.abs(pointer.x - lastPointer.current.x) + Math.abs(pointer.y - lastPointer.current.y) > 0.002;
    lastPointer.current = { x: pointer.x, y: pointer.y };
    mouseOn.current += ((moved ? 1 : mouseOn.current * 0.6) - mouseOn.current) * (1 - Math.exp(-dt * 4));
    uniforms.uMouseOn.value = Math.min(1, mouseOn.current + 0.0);

    // composition: shape sits right of centre on wide screens (headline is bottom-left)
    const wide = size.width / size.height > 1.25;
    const tx = wide ? halfW * 0.36 : 0;
    const ty = wide ? halfH * 0.3 : halfH * 0.3;
    g.position.x += (tx - g.position.x) * (1 - Math.exp(-dt * 3));
    g.position.y += (ty - g.position.y) * (1 - Math.exp(-dt * 3));
    const sc = wide ? 0.78 : Math.min(0.8, (size.width / size.height) * 1.2);
    g.scale.setScalar(sc);
    g.rotation.y = Math.sin(t * 0.2) * 0.25 + pointer.x * 0.15;
    g.rotation.x = -pointer.y * 0.1;
  });

  return (
    <group ref={group}>
      <points geometry={geo} material={material} frustumCulled={false} />
    </group>
  );
}

/** Slow drifting dust for depth. */
const dustVert = /* glsl */ `
  uniform float uTime; uniform float uPx; attribute float aSeed; varying float vA;
  void main() {
    vec3 p = position;
    float a = uTime * (0.02 + aSeed * 0.04);
    float c = cos(a), s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p.y += sin(uTime * 0.4 + aSeed * 30.0) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 + aSeed * 2.4) * uPx * (9.0 / -mv.z) * (0.6 + 0.4 * sin(uTime * 1.6 + aSeed * 60.0));
    vA = 0.18 + 0.4 * aSeed;
  }
`;
const dustFrag = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vec3(0.55, 0.75, 1.0), smoothstep(0.5, 0.0, d) * vA);
  }
`;
function Dust({ count }) {
  const px = useThree((s) => s.viewport.dpr);
  const { geo, uniforms, material } = useMemo(() => {
    const position = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 3 + rand() * 9;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      position[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.4;
      position[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      position[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 4;
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const uniforms = { uTime: { value: 0 }, uPx: { value: 1 } };
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, uniforms, material };
  }, [count]);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uPx.value = px;
  });
  return (
    <points geometry={geo} material={material} frustumCulled={false} />
  );
}

/* ------------------------------------------------------------------ safety net */

/** If the device can't keep up (< ~20 fps after warm-up) ask for a lighter quality tier. */
function FpsGuard({ onSlow }) {
  const s = useRef({ start: 0, winStart: 0, frames: 0, last: 0, hiddenSeen: false });
  useEffect(() => {
    s.current.start = performance.now();
    const onVis = () => {
      if (document.hidden) s.current.hiddenSeen = true;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useFrame(() => {
    const st = s.current;
    const now = performance.now();
    if (now - st.start < 2500) {
      st.winStart = now;
      st.frames = 0;
      return;
    }
    if (st.hiddenSeen && now - st.last > 1000) {
      st.hiddenSeen = false;
      st.winStart = now;
      st.frames = 0;
      st.last = now;
      return;
    }
    st.last = now;
    st.frames += 1;
    const el = now - st.winStart;
    if (el >= 2500) {
      if (st.frames / (el / 1000) < 20) onSlow();
      st.winStart = now;
      st.frames = 0;
    }
  });
  return null;
}

function Scene({ quality, shape, onSlow }) {
  return (
    <>
      <color attach="background" args={["#02040e"]} />
      <FpsGuard key={quality} onSlow={onSlow} />
      <Dust count={quality >= 2 ? 900 : 400} />
      <Particles count={quality >= 2 ? 32000 : 12000} shape={shape} />
      {quality >= 2 && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.12} luminanceSmoothing={0.6} />
        </EffectComposer>
      )}
    </>
  );
}

export default function HeroScene({ shape, onFail }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [quality, setQuality] = useState(2); // 2 = bloom + full count, 1 = lighter, 0 = static fallback

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  const onSlow = () => {
    if (quality > 1) setQuality(1);
    else onFail();
  };

  return (
    <div ref={wrap} className="scene3d">
      <Canvas
        // Pause rendering when scrolled out of view (or for reduced-motion users: a single still frame).
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
        frameloop={visible && !reduced ? "always" : "demand"}
        dpr={quality >= 2 ? [1, 1.5] : 1}
        camera={{ position: [0, 0, 9.5], fov: 38 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      >
        <Scene quality={quality} shape={shape} onSlow={onSlow} />
      </Canvas>
    </div>
  );
}
