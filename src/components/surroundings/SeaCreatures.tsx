import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";

/* ---------- Dolphin ---------- */

interface DolphinProps {
  centerX: number;
  centerZ: number;
  radius: number;
  jumpHeight: number;
  speed: number;
  phase: number;
  color: string;
}

function Dolphin({
  centerX,
  centerZ,
  radius,
  jumpHeight,
  speed,
  phase,
  color,
}: DolphinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const splashRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = ((clock.getElapsedTime() * speed + phase) % 6) / 6;

    const angle = t * Math.PI * 2;
    groupRef.current.position.x = centerX + Math.cos(angle) * radius;
    groupRef.current.position.z = centerZ + Math.sin(angle) * radius;

    // Jump arc: visible for ~40% of the loop, underwater rest
    const jumpPhase = (t * 3) % 1;
    if (jumpPhase < 0.4) {
      const jt = jumpPhase / 0.4;
      groupRef.current.position.y = -1.5 + Math.sin(jt * Math.PI) * jumpHeight;
      groupRef.current.rotation.z = -Math.cos(jt * Math.PI) * 0.6;
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }

    // Face swimming direction (-angle - Math.PI / 2 correctly points velocity forward)
    groupRef.current.rotation.y = -angle - Math.PI / 2;

    if (splashRef.current) {
      splashRef.current.position.set(groupRef.current.position.x, -1.0, groupRef.current.position.z);
      splashRef.current.visible = jumpPhase < 0.4 && groupRef.current.position.y < -0.5;
    }
  });

  return (
    <>
      <group ref={groupRef}>
      {/* Body */}
      <mesh scale={[1.8, 0.5, 0.45]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, -0.05, 0]} scale={[1.75, 0.46, 0.43]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.4} />
      </mesh>
      {/* Snout */}
      <mesh position={[1.4, -0.05, 0]} scale={[0.6, 0.2, 0.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Eyes */}
      <mesh position={[1.1, 0.15, 0.3]} scale={[0.08, 0.08, 0.08]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[1.1, 0.15, -0.3]} scale={[0.08, 0.08, 0.08]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[1.14, 0.18, 0.34]} scale={[0.03, 0.03, 0.03]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[1.14, 0.18, -0.34]} scale={[0.03, 0.03, 0.03]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Dorsal fin */}
      <mesh position={[-0.2, 0.45, 0]} rotation={[0, 0, -0.2]} scale={[0.4, 0.4, 0.1]}>
        <coneGeometry args={[1, 1, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Side fins */}
      <mesh position={[0.5, -0.2, 0.4]} rotation={[0.4, 0, -0.5]} scale={[0.3, 0.1, 0.4]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, -0.2, -0.4]} rotation={[-0.4, 0, -0.5]} scale={[0.3, 0.1, 0.4]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Tail */}
      <mesh position={[-1.6, 0, 0]} rotation={[0, 0, 0]} scale={[0.5, 0.1, 0.6]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      </group>

      {/* Splash effect */}
      <group ref={splashRef}>
        <Sparkles
          count={30}
          scale={[3, 1, 3]}
          position={[0, 0, 0]}
          speed={0.8}
          opacity={0.8}
          color="#ffffff"
          size={5}
        />
      </group>
    </>
  );
}

/* ---------- Whale ---------- */

interface WhaleProps {
  centerX: number;
  centerZ: number;
  radius: number;
  speed: number;
  phase: number;
}

function Whale({ centerX, centerZ, radius, speed, phase }: WhaleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const splashRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = ((clock.getElapsedTime() * speed + phase) % 10) / 10;

    const angle = t * Math.PI * 2;
    groupRef.current.position.x = centerX + Math.cos(angle) * radius;
    groupRef.current.position.z = centerZ + Math.sin(angle) * radius;

    // Gentle surfacing: visible ~30% of loop
    const surfPhase = (t * 2.5) % 1;
    if (surfPhase < 0.3) {
      const st = surfPhase / 0.3;
      groupRef.current.position.y = -1.5 + Math.sin(st * Math.PI) * 2;
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }

    groupRef.current.rotation.y = -angle - Math.PI / 2;
    // Gentle roll
    groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;

    if (splashRef.current) {
      splashRef.current.position.set(groupRef.current.position.x, -1.0, groupRef.current.position.z);
      splashRef.current.visible = surfPhase < 0.3 && groupRef.current.position.y < -0.5;
    }
  });

  return (
    <>
    <group ref={groupRef} scale={[3, 1, 1.2]}>
      {/* Body */}
      <mesh scale={[2.5, 1.1, 1.1]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#5B7FA5" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, -0.2, 0]} scale={[2.4, 0.95, 1.05]}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="#E8F1F5" roughness={0.4} />
      </mesh>
      {/* Eyes */}
      <mesh position={[1.5, 0.2, 0.95]} scale={[0.12, 0.12, 0.12]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[1.5, 0.2, -0.95]} scale={[0.12, 0.12, 0.12]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[1.55, 0.25, 1.0]} scale={[0.04, 0.04, 0.04]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[1.55, 0.25, -1.0]} scale={[0.04, 0.04, 0.04]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Side fins */}
      <mesh position={[0.5, -0.3, 1.1]} rotation={[0.3, 0, -0.3]} scale={[0.6, 0.1, 0.4]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#5B7FA5" roughness={0.3} />
      </mesh>
      <mesh position={[0.5, -0.3, -1.1]} rotation={[-0.3, 0, -0.3]} scale={[0.6, 0.1, 0.4]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#5B7FA5" roughness={0.3} />
      </mesh>
      {/* Tail */}
      <mesh position={[-2.6, 0, 0]} rotation={[0, 0, 0]} scale={[0.8, 0.1, 1.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#5B7FA5" roughness={0.3} />
      </mesh>
      {/* Water spout */}
      <mesh position={[1.5, 1.2, 0]} scale={[0.05, 0.5, 0.05]}>
        <cylinderGeometry args={[1, 0.3, 1, 6]} />
        <meshStandardMaterial color="#B8D8EA" transparent opacity={0.6} />
      </mesh>
      
    </group>

    {/* Splash effect */}
    <group ref={splashRef}>
      <Sparkles
        count={60}
        scale={[6, 2, 6]}
        position={[0, 0, 0]}
        speed={0.5}
        opacity={0.6}
        color="#ffffff"
        size={8}
      />
    </group>
    </>
  );
}

/* ---------- Fish School ---------- */

const FISH_COUNT = 60;

function FishSchool() {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    geometry.rotateX(Math.PI / 2); // align tip to +Z
    return geometry;
  }, []);

  const fishData = useMemo(
    () =>
      Array.from({ length: FISH_COUNT }, (_, i) => ({
        offset: i * 0.12,
        radiusOffset: (Math.random() - 0.5) * 6,
        yOffset: (Math.random() - 0.5) * 3,
        speed: 0.15 + Math.random() * 0.05,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!instancedRef.current) return;
    const time = clock.getElapsedTime();

    for (let i = 0; i < FISH_COUNT; i++) {
      const f = fishData[i];
      const angle = time * f.speed + f.offset;
      const r = 30 + f.radiusOffset + Math.sin(time + i) * 3;
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = -2.0 + f.yOffset + Math.sin(time * 2 + i) * 0.5;

      const nextAngle = angle + 0.05;
      const nextR = 30 + f.radiusOffset + Math.sin(time + 0.05 + i) * 3;
      const nextX = Math.cos(nextAngle) * nextR;
      const nextZ = Math.sin(nextAngle) * nextR;
      const nextY = -2.0 + f.yOffset + Math.sin((time + 0.05) * 2 + i) * 0.5;

      dummy.position.set(x, y, z);
      dummy.lookAt(nextX, nextY, nextZ);
      dummy.scale.setScalar(0.5);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[geo, undefined, FISH_COUNT]}>
      <meshStandardMaterial color="#FFB7B2" roughness={0.6} />
    </instancedMesh>
  );
}

/* ---------- Aggregator ---------- */

export function SeaCreatures() {
  const dolphins = useMemo(
    () => [
      { centerX: -25, centerZ: -18, radius: 8, jumpHeight: 4, speed: 0.25, phase: 0, color: "#7BAEC8" },
      { centerX: 28, centerZ: 15, radius: 9, jumpHeight: 3.5, speed: 0.3, phase: 2, color: "#8AB8D0" },
      { centerX: -10, centerZ: 30, radius: 10, jumpHeight: 5, speed: 0.2, phase: 4, color: "#6DA0BC" },
    ],
    [],
  );

  const whales = useMemo(
    () => [
      { centerX: 28, centerZ: -28, radius: 15, speed: 0.08, phase: 0 },
      { centerX: -30, centerZ: 25, radius: 14, speed: 0.1, phase: 3 },
    ],
    [],
  );

  return (
    <>
      {dolphins.map((d, i) => (
        <Dolphin key={`d${i}`} {...d} />
      ))}
      {whales.map((w, i) => (
        <Whale key={`w${i}`} {...w} />
      ))}
      <FishSchool />
    </>
  );
}
