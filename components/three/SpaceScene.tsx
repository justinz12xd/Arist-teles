"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useReducedMotion, useScroll, useSpring, type MotionValue } from "framer-motion";
import * as THREE from "three";

type Scroll = { progress: MotionValue<number> };

const EARTH_NORMAL_SCALE = new THREE.Vector2(0.8, 0.8);
const EARTH_SPECULAR = new THREE.Color("#8ab4d8");

/* La Tierra con textura satelital NASA — océanos, continentes y nubes de relieve */
function Earth({ progress }: Scroll) {
  const group = useRef<THREE.Group>(null);
  const ref = useRef<THREE.Mesh>(null);
  const [map, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_atmos_2048.jpg",
    "/textures/earth_normal_2048.jpg",
    "/textures/earth_specular_2048.jpg",
  ]);
  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
  }, [map]);

  useFrame((_, delta) => {
    const p = progress.get();
    if (group.current) {
      group.current.position.y = -9.2 + p * 4.2;
      group.current.position.z = -6 + p * 2;
      group.current.position.x = 1.5 - p * 1.2;
      group.current.rotation.y = p * 0.55;
    }
    // giro propio + giro acoplado al scroll — la sentís rotar al scrollear
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });
  return (
    <group ref={group} position={[1.5, -9.2, -6]} rotation={[0.15, 0, 0.35]}>
      <mesh ref={ref}>
        <sphereGeometry args={[8, 96, 96]} />
        {/* phong: specularMap hace brillar SOLO el agua bajo el sol */}
        <meshPhongMaterial
          map={map}
          normalMap={normalMap}
          normalScale={EARTH_NORMAL_SCALE}
          specularMap={specularMap}
          specular={EARTH_SPECULAR}
          shininess={18}
        />
      </mesh>
      {/* atmósfera — capa aditiva azul apenas mayor */}
      <mesh scale={1.015}>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      {/* halo del limbo — el brillo del amanecer orbital */}
      <mesh scale={1.04}>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial
          color="#7ecbff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* Luna con textura NASA — cráteres reales, barre en parallax cercano */
function Moon({ progress }: Scroll) {
  const ref = useRef<THREE.Mesh>(null);
  const map = useLoader(THREE.TextureLoader, "/textures/moon_1024.jpg");
  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
  }, [map]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const p = progress.get();
    ref.current.rotation.y += delta * 0.005;
    ref.current.position.x = -4.6 - p * 2.8;
    ref.current.position.y = 0.4 + p * 3.2;
    ref.current.position.z = -2.5 + p * 1.4;
    const s = 1 + p * 0.35;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[-4.6, 0.4, -2.5]}>
      <sphereGeometry args={[1.6, 64, 64]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

/* Sol — núcleo brillante + glare con sprite de gradiente radial */
function useSunGlareTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;

    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255, 236, 200, 1)");
    grad.addColorStop(0.15, "rgba(255, 180, 90, 0.7)");
    grad.addColorStop(0.4, "rgba(255, 130, 40, 0.22)");
    grad.addColorStop(0.7, "rgba(255, 100, 30, 0.07)");
    grad.addColorStop(1, "rgba(255, 100, 30, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(c);
  }, []);
}

function Sun({ progress }: Scroll) {
  const ref = useRef<THREE.Group>(null);
  const glareTexture = useSunGlareTexture();

  useEffect(() => {
    return () => {
      glareTexture?.dispose();
    };
  }, [glareTexture]);

  useFrame(() => {
    if (!ref.current) return;
    // el sol está lejos: es la capa que menos se mueve — eso vende la profundidad
    const p = progress.get();
    ref.current.position.y = 3.4 - p * 0.9;
    ref.current.position.x = 7 - p * 0.5;
  });
  return (
    <group ref={ref} position={[7, 3.4, -12]}>
      <mesh>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshBasicMaterial color="#fff8e7" />
      </mesh>
      {glareTexture && (
        <sprite scale={[7, 7, 1]}>
          <spriteMaterial
            map={glareTexture}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

function Station({ progress, reducedMotion }: Scroll & { reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const p = progress.get();
    const driftY = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.12;
    const driftX = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.08;
    ref.current.position.y = 2.4 + driftY - p * 2.2;
    ref.current.position.x = -4.2 + driftX + p * 1.6;
    ref.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.3) * 0.05;
  });
  return (
    <group ref={ref} position={[-4.2, 2.4, -6]} rotation={[0.3, 0.6, 0]} scale={0.7}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 1.1, 8]} />
        <meshStandardMaterial color="#9aa8b5" roughness={0.4} metalness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.9, 0.42]} />
          <meshStandardMaterial
            color="#1a3a5c"
            roughness={0.2}
            metalness={0.6}
            emissive="#22d3ee"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneContents({ progress, reducedMotion }: Scroll & { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!group.current) return;
    const p = progress.get();
    // mouse parallax + tilt leve de toda la escena acoplado al scroll
    const targetY = reducedMotion ? 0 : pointer.x * 0.03;
    const targetX = reducedMotion ? 0 : -pointer.y * 0.02;
    const targetZ = reducedMotion ? 0 : p * -0.03;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.05);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetZ, 0.08);
  });
  return (
    <group ref={group}>
      <ambientLight intensity={0.18} color="#bcd4f0" />
      {/* luz clave desde el sol — cálida pero sin teñir los océanos */}
      <directionalLight position={[7, 3.4, -4]} intensity={2.1} color="#ffe6c2" />
      {/* relleno frío — mantiene el azul del agua en las zonas de sombra */}
      <directionalLight position={[-4, -2, 3]} intensity={0.5} color="#4a9eff" />
      <Stars radius={80} depth={40} count={reducedMotion ? 2200 : 4200} factor={3.2} saturation={0.35} fade speed={reducedMotion ? 0 : 0.4} />
      <Stars radius={50} depth={20} count={reducedMotion ? 800 : 1500} factor={2} saturation={0.2} fade speed={reducedMotion ? 0 : 0.8} />
      <Suspense fallback={null}>
        <Earth progress={progress} />
        <Moon progress={progress} />
      </Suspense>
      <Sun progress={progress} />
      <Station progress={progress} reducedMotion={reducedMotion} />
    </group>
  );
}

export default function SpaceScene() {
  const [mounted, setMounted] = useState(false);
  const [dpr, setDpr] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // el spring es lo que da vida: los planetas siguen el scroll con inercia física
  const progress = useSpring(scrollYProgress, { stiffness: 55, damping: 18, mass: 0.7 });
  const reducedMotion = shouldReduceMotion ?? false;

  useEffect(() => {
    setMounted(true);
    setDpr(Math.min(window.devicePixelRatio || 1, 1.5));
  }, []);

  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <div className="scene-gradient absolute inset-0" />
      {/* vía láctea — banda diagonal difusa */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 28%, rgb(140 170 220 / 0.05) 42%, rgb(200 215 245 / 0.09) 50%, rgb(140 170 220 / 0.05) 58%, transparent 72%)",
        }}
      />
      {/* polvo estelar CSS — neutro, apenas perceptible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 35% at 70% 20%, rgb(160 175 200 / 0.04), transparent 70%), radial-gradient(50% 40% at 20% 70%, rgb(150 150 170 / 0.03), transparent 70%)",
        }}
      />
      {mounted && !reducedMotion && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          dpr={dpr}
          gl={{ antialias: false, powerPreference: "low-power" }}
        >
          <SceneContents progress={progress} reducedMotion={reducedMotion} />
        </Canvas>
      )}
    </div>
  );
}
