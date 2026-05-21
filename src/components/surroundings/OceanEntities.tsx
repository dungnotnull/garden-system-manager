import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function OceanEntities() {
  return (
    <>
      <BirdFlock />
      <Boat />
    </>
  );
}

const BIRD_COUNT = 25;
function Seagull({ offset, r, yBase, speed }: { offset: number, r: number, yBase: number, speed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !wingsRef.current) return;
    const time = clock.getElapsedTime();
    const angle = time * speed + offset;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = yBase + Math.sin(time * 3 + offset) * 1.5;

    const nextAngle = angle + 0.1;
    const nx = Math.cos(nextAngle) * r;
    const nz = Math.sin(nextAngle) * r;

    groupRef.current.position.set(x, y, z);
    groupRef.current.lookAt(nx, y, nz);
    
    // flap wings
    wingsRef.current.rotation.z = Math.sin(time * 15 + offset * 10) * 0.5;
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh scale={[0.15, 0.15, 0.5]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.2, 8]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
      {/* Wings */}
      <group ref={wingsRef}>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

function BirdFlock() {
  const birds = useMemo(() => 
    Array.from({ length: BIRD_COUNT }, (_, i) => ({
      offset: i * 0.5,
      r: 15 + Math.random() * 15,
      yBase: 8 + Math.random() * 5,
      speed: 0.1 + Math.random() * 0.1
    }))
  , []);

  return (
    <>
      {birds.map((b, i) => (
        <Seagull key={`bird-${i}`} offset={b.offset} r={b.r} yBase={b.yBase} speed={b.speed} />
      ))}
    </>
  );
}

function Boat() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime() * 0.05;
    const r = 70;
    const x = Math.cos(time) * r;
    const z = Math.sin(time) * r;
    const y = -1.6 + Math.sin(time * 20) * 0.2;
    
    groupRef.current.position.set(x, y, z);
    const nx = Math.cos(time + 0.1) * r;
    const nz = Math.sin(time + 0.1) * r;
    groupRef.current.lookAt(nx, y, nz);
    
    // Rocking on waves
    groupRef.current.rotation.z = Math.sin(time * 40) * 0.1;
    groupRef.current.rotation.x = Math.cos(time * 30) * 0.05;
  });

  return (
    <group ref={groupRef} scale={[1.2, 1.2, 1.2]}>
      {/* Hull */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 3.5]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Front Tip */}
      <mesh position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0, 0.75, 1, 4]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Sail */}
      <mesh position={[0, 1.5, 0.5]} rotation={[0, Math.PI / 6, 0]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3.5]} />
        <meshStandardMaterial color="#5c3a21" />
      </mesh>
    </group>
  );
}
