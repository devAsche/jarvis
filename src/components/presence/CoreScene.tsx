"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GraphicsQuality } from "../../contracts";
import { CORE_TONES, type CoreTone, type SourceProgress } from "./CoreVisualState";

interface CoreSceneProps {
  tone: CoreTone;
  sources: SourceProgress[];
  quality: GraphicsQuality;
  audioLevel?: number;
  reducedMotion?: boolean;
}

const BASE = "#56c8ff";
const R = 1.85;
const TAU = Math.PI * 2;

function tickPositions(count: number) {
  const positions = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    const len = i % 15 === 0 ? 0.13 : i % 5 === 0 ? 0.075 : 0.035;
    positions.set([Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(a) * (R - len), Math.sin(a) * (R - len), 0], i * 6);
  }
  return positions;
}

function circlePoints(radius: number, count: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    positions.set([Math.cos(a) * radius, Math.sin(a) * radius, 0], i * 3);
  }
  return positions;
}

/** Additive, depth-free material so overlapping rings bloom without a post-processing pass. */
function useGlowMaterial(color: string, opacity: number) {
  return useMemo(() => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), [color, opacity]);
}

const SEGMENTS: Array<[number, number]> = [[0, 0.7], [0.82, 1.6], [1.75, 1.95], [2.4, 3.5], [3.65, 4.1], [4.5, 5.6]];
const SOURCE_SPAN = TAU / 3 - 0.16;

export function CoreScene({ tone, sources, quality, audioLevel = 0, reducedMotion = false }: CoreSceneProps) {
  const low = quality === "low";
  const cfg = CORE_TONES[tone];
  const outer = useRef<THREE.Group>(null);
  const segmented = useRef<THREE.Group>(null);
  const dashed = useRef<THREE.Points>(null);
  const notches = useRef<THREE.Group>(null);
  const iris = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Mesh>(null);
  const heart = useRef<THREE.Group>(null);
  const alarm = useRef<THREE.Mesh>(null);

  // Tone colours ease toward their target instead of snapping.
  const initial = useRef(cfg).current;
  const target = useRef({ main: new THREE.Color(cfg.main), hi: new THREE.Color(cfg.hi) });
  useEffect(() => { target.current.main.set(cfg.main); target.current.hi.set(cfg.hi); }, [cfg.main, cfg.hi]);

  const ticks = useMemo(() => tickPositions(low ? 90 : 180), [low]);
  const dots = useMemo(() => circlePoints(R * 0.8, low ? 70 : 140), [low]);

  const baseLine = useMemo(() => new THREE.LineBasicMaterial({ color: BASE, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const baseDim = useGlowMaterial(BASE, 0.12);
  const baseMid = useGlowMaterial(BASE, 0.7);
  const accentSolid = useMemo(() => new THREE.MeshBasicMaterial({ color: initial.main, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [initial.main]);
  const accentSoft = useMemo(() => new THREE.MeshBasicMaterial({ color: initial.main, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }), [initial.main]);
  const hiSolid = useMemo(() => new THREE.MeshBasicMaterial({ color: initial.hi, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [initial.hi]);
  const dotMaterial = useMemo(() => new THREE.PointsMaterial({ color: initial.hi, size: low ? 0.02 : 0.026, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }), [initial.hi, low]);
  const failMaterial = useGlowMaterial(CORE_TONES.error.main, 0.85);
  const bladeMaterials = useMemo(() => Array.from({ length: 12 }, () => new THREE.MeshBasicMaterial({ color: initial.main, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), [initial.main]);

  useEffect(() => () => {
    [baseLine, baseDim, baseMid, accentSolid, accentSoft, hiSolid, dotMaterial, failMaterial, ...bladeMaterials].forEach((m) => m.dispose());
  }, [baseLine, baseDim, baseMid, accentSolid, accentSoft, hiSolid, dotMaterial, failMaterial, bladeMaterials]);

  useFrame(({ clock }, delta) => {
    const k = Math.min(1, delta * 3);
    [accentSolid, accentSoft, ...bladeMaterials].forEach((m) => m.color.lerp(target.current.main, k));
    [hiSolid, dotMaterial].forEach((m) => m.color.lerp(target.current.hi, k));
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const s = cfg.speed;
    if (outer.current) outer.current.rotation.z -= delta * 0.03 * s;
    if (segmented.current) segmented.current.rotation.z += delta * 0.12 * s;
    if (dashed.current) dashed.current.rotation.z -= delta * 0.2 * s;
    if (notches.current) notches.current.rotation.z += delta * 0.25 * s;
    if (iris.current) iris.current.rotation.z -= delta * 0.35 * s;
    if (orbit.current) { orbit.current.rotation.z += delta * 0.4 * s; }
    if (tilt.current) { tilt.current.rotation.x = -0.18 + Math.sin(t * 0.25) * 0.05; tilt.current.rotation.y = Math.sin(t * 0.18) * 0.12; }
    bladeMaterials.forEach((m, i) => { m.opacity = 0.35 + 0.25 * Math.sin(t * 2 * (s + 0.3) + i); });
    if (heart.current) heart.current.scale.setScalar(1 + 0.06 * Math.sin(t * 3 * (s + 0.3)) + audioLevel * 0.15);
    if (alarm.current) (alarm.current.material as THREE.MeshBasicMaterial).opacity = tone === "error" ? 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 8)) : 0;
    accentSoft.opacity = tone === "working" ? 0.14 + 0.08 * Math.sin(t * 4) : 0.18;
  });

  return (
    <group ref={tilt}>
      {/* outer instrument scale (always blue: it is the UI, not the state) */}
      <group ref={outer}>
        <lineSegments material={baseLine}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[ticks, 3]} /></bufferGeometry>
        </lineSegments>
      </group>
      <mesh material={baseDim}><ringGeometry args={[R + 0.06, R + 0.075, 128]} /></mesh>
      <mesh ref={alarm}><ringGeometry args={[R * 0.94, R * 0.955, 128]} /><meshBasicMaterial color={CORE_TONES.error.main} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>

      {/* segmented ring: alternate segments take the state colour */}
      <group ref={segmented}>
        {SEGMENTS.map(([a, b], i) => (
          <mesh key={i} material={i % 2 === 0 ? accentSolid : baseMid}>
            <ringGeometry args={[R * 0.84, R * 0.88, low ? 32 : 64, 1, a, b - a]} />
          </mesh>
        ))}
      </group>
      <points ref={dashed} material={dotMaterial}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dots, 3]} /></bufferGeometry>
      </points>

      {/* three fixture lanes: shopify / gmail / calendar */}
      {sources.map((progress, i) => {
        const start = Math.PI / 2 - i * (TAU / 3) - 0.08 - SOURCE_SPAN;
        const fill = progress === "done" || progress === "failed" ? 1 : progress === "running" ? 0.62 : 0;
        return (
          <group key={i}>
            <mesh material={baseDim}><ringGeometry args={[R * 0.67, R * 0.73, 48, 1, start, SOURCE_SPAN]} /></mesh>
            {fill > 0 && (
              <mesh material={progress === "failed" ? failMaterial : i % 2 && tone === "working" ? hiSolid : accentSolid}>
                <ringGeometry args={[R * 0.67, R * 0.73, 48, 1, start + SOURCE_SPAN * (1 - fill), SOURCE_SPAN * fill]} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* inner instrument ring with four notches */}
      <mesh material={baseMid}><ringGeometry args={[R * 0.555, R * 0.562, 128]} /></mesh>
      <group ref={notches}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={hiSolid} rotation={[0, 0, (i * Math.PI) / 2]} position={[Math.cos((i * Math.PI) / 2) * R * 0.59, Math.sin((i * Math.PI) / 2) * R * 0.59, 0]}>
            <circleGeometry args={[0.05, 3, Math.PI]} />
          </mesh>
        ))}
      </group>

      {/* tilted orbit gives the flat HUD real depth */}
      {!low && (
        <mesh ref={orbit} rotation={[1.15, 0.2, 0]} material={accentSoft}>
          <torusGeometry args={[R * 0.48, 0.006, 6, 128]} />
        </mesh>
      )}

      {/* iris: twelve blades */}
      <group ref={iris}>
        {bladeMaterials.map((m, i) => (
          <mesh key={i} material={m}>
            <ringGeometry args={[R * 0.25, R * 0.37, 8, 1, (i * TAU) / 12 + 0.1, TAU / 12 - 0.2]} />
          </mesh>
        ))}
      </group>

      {/* heart: layered discs fake a bloom */}
      <group ref={heart} position={[0, 0, 0.02]}>
        {[0.42, 0.3, 0.22].map((r, i) => (
          <mesh key={r} material={i === 2 ? hiSolid : accentSoft}><circleGeometry args={[R * r * 0.5, 48]} /></mesh>
        ))}
        <mesh><circleGeometry args={[R * 0.07, 32]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} /></mesh>
        <mesh material={hiSolid}><ringGeometry args={[R * 0.175, R * 0.185, 64]} /></mesh>
      </group>
    </group>
  );
}
