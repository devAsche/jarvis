"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CoreEffectMode, CoreVisualState, GraphicsQuality } from "../../contracts";
import { STATE_VISUAL_CONFIGS } from "./CoreVisualState";

interface CoreSceneProps {
  operationalState: CoreVisualState;
  mode: CoreEffectMode;
  quality: GraphicsQuality;
  audioLevel?: number;
  reducedMotion?: boolean;
}

// Thin elliptical traces at distinct depths; the core stays quiet at idle.
function trace(rx: number, ry: number, start: number, end: number, depth: number, steps: number) {
  const points = new Float32Array(steps * 6);
  for (let i = 0; i < steps; i++) {
    for (let side = 0; side < 2; side++) {
      const angle = start + (end - start) * (i + side) / steps;
      const wave = 1 + 0.035 * Math.sin(angle * 3 + depth * 2);
      const offset = (i * 2 + side) * 3;
      points[offset] = Math.cos(angle) * rx * wave;
      points[offset + 1] = Math.sin(angle) * ry * wave;
      points[offset + 2] = depth + 0.07 * Math.sin(angle * 2);
    }
  }
  return points;
}

function stars(count: number) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = i * 2.3999632297;
    const radius = 1.45 + (i * 37 % 29) / 29 * 0.8;
    points[i * 3] = Math.cos(angle) * radius;
    points[i * 3 + 1] = Math.sin(angle) * radius * 0.54;
    points[i * 3 + 2] = (i % 3 - 1) * 0.4;
  }
  return points;
}

export function CoreScene({ operationalState, mode, quality, audioLevel = 0, reducedMotion = false }: CoreSceneProps) {
  const config = STATE_VISUAL_CONFIGS[operationalState] ?? STATE_VISUAL_CONFIGS.idle;
  const group = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.Mesh>(null);
  const low = quality === "low";
  const traces = useMemo(() => [
    trace(1.67, 1.15, -2.54, 2.6, 0.28, low ? 38 : 76),
    trace(1.31, 0.98, -0.04, 4.56, -0.28, low ? 30 : 60),
    trace(1.02, 0.84, -1.36, 3.46, 0.03, low ? 26 : 52),
    trace(2.13, 0.52, 0.25, 3.26, -0.48, low ? 22 : 44),
  ], [low]);
  const particles = useMemo(() => stars(low ? 26 : mode === "surge" ? 75 : 48), [low, mode]);
  const muted = operationalState === "offline" || operationalState === "error";
  const accent = operationalState === "error" ? "#d69491" : operationalState === "offline" ? "#7c9ba6" : "#a6e1e2";

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    if (group.current) {
      const pace = mode === "surge" ? 1.7 : mode === "network" ? 1.3 : 1;
      group.current.rotation.y += delta * config.rotationSpeed * 0.08 * pace;
      group.current.rotation.z += delta * config.rotationSpeed * 0.18 * pace;
    }
    if (nucleus.current) {
      nucleus.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.6) * 0.3 + audioLevel * 0.2);
    }
  });

  return <group ref={group} scale={1.25}>
    {traces.map((positions, index) => <lineSegments key={index}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <lineBasicMaterial color={index === 0 ? accent : "#8fc6d1"} transparent opacity={muted ? 0.14 : index === 0 ? 0.63 : 0.18 + (mode === "surge" ? 0.11 : 0)} depthWrite={false} />
    </lineSegments>)}
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
      <pointsMaterial color="#98cbd2" size={low ? 0.012 : 0.016} transparent opacity={muted ? 0.13 : 0.3} sizeAttenuation depthWrite={false} />
    </points>
    {[[1.22, 0.77], [-1.1, -0.74], [0.32, -1.09], [0.86, 0.06], [-0.61, 0.6]].map(([x, y], index) => <mesh key={index} position={[x, y, index % 2 ? -0.1 : 0.5]}>
      <sphereGeometry args={[index === 0 ? 0.028 : 0.019, 8, 8]} />
      <meshBasicMaterial color={accent} transparent opacity={muted ? 0.2 : 0.9} />
    </mesh>)}
    <mesh ref={nucleus} position={[0, 0, 0.7]}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshBasicMaterial color="#d7f9f7" transparent opacity={muted ? 0.25 : 0.92} />
    </mesh>
  </group>;
}
