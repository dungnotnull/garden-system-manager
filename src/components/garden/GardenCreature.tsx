import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { CreatureData } from "../../types/process";
import { memoryToScale } from "../../lib/scaling";
import { nameToColor } from "../../lib/color-assign";
import { PALETTE } from "../../lib/palette";

export const creaturePositions = new Map<string, THREE.Vector3>();

function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    hash = Math.sin(hash++) * 10000;
    return hash - Math.floor(hash);
  };
}

interface GardenCreatureProps {
  data: CreatureData;
  position: [number, number, number];
  isSelected: boolean;
  isExiting?: boolean;
  onSelect: (key: string) => void;
  onExitComplete?: () => void;
}

const LOW_CPU = 10;
const HIGH_CPU = 50;

export function GardenCreature({
  data,
  position,
  isSelected,
  isExiting,
  onSelect,
  onExitComplete,
}: GardenCreatureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const initialScale = useRef(0.01);

  const color = useMemo(() => nameToColor(data.name), [data.name]);
  const targetScale = useMemo(() => memoryToScale(data.totalMemory), [data.totalMemory]);
  const isFrozen = !data.isResponding;

  const animSpeed = useMemo(() => {
    if (isFrozen) return 0;
    if (data.maxCpu > HIGH_CPU) return 3 + (data.maxCpu / 100) * 4;
    if (data.maxCpu > LOW_CPU) return 1 + (data.maxCpu / 100) * 2;
    return 0.3;
  }, [data.maxCpu, isFrozen]);

  const squishAmount = useMemo(() => {
    if (isFrozen) return 0;
    if (data.maxCpu > HIGH_CPU) return 0.15;
    if (data.maxCpu > LOW_CPU) return 0.08;
    return 0.03;
  }, [data.maxCpu, isFrozen]);

  const rand = useMemo(() => seededRandom(data.name), [data.name]);
  const hasHat = useMemo(() => rand() > 0.6, [rand]);
  const hasGlasses = useMemo(() => rand() > 0.7, [rand]);
  const hairType = useMemo(() => rand() > 0.8 ? "short" : rand() > 0.5 ? "long" : "none", [rand]);
  const hasShirt = useMemo(() => rand() > 0.5, [rand]);
  const shirtColor = useMemo(() => `hsl(${Math.floor(rand() * 360)}, 70%, 60%)`, [rand]);
  const hairColor = useMemo(() => `hsl(${Math.floor(rand() * 360)}, 50%, 30%)`, [rand]);

  const targetOffset = useRef(new THREE.Vector3(0, 0, 0));
  const currentOffset = useRef(new THREE.Vector3(0, 0, 0));
  const [talkBubble, setTalkBubble] = useState<string | null>(null);

  useEffect(() => {
    if (isFrozen) return;
    const interval = setInterval(() => {
      targetOffset.current.set(
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      );
    }, 4000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [isFrozen]);

  useEffect(() => {
    const phrases = ["hello!", "bye-bye", "how are you today?", "working hard!", "beep boop"];
    const interval = setInterval(() => {
      if (Math.random() > 0.85 && !isFrozen) {
        setTalkBubble(phrases[Math.floor(Math.random() * phrases.length)]);
        setTimeout(() => setTalkBubble(null), 3000);
      }
    }, 8000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [isFrozen]);

  // Cleanup map
  useEffect(() => {
    return () => {
      creaturePositions.delete(data.name);
    };
  }, [data.name]);

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const scaleTarget = isExiting ? 0 : 1;
    initialScale.current = THREE.MathUtils.lerp(initialScale.current, scaleTarget, delta * 3);
    groupRef.current.scale.setScalar(initialScale.current);

    if (isExiting && initialScale.current < 0.02) {
      onExitComplete?.();
      return;
    }

    // Wandering
    if (!isFrozen && !isExiting) {
      currentOffset.current.lerp(targetOffset.current, delta * 0.5);
    }
    // Set actual position: home + offset
    groupRef.current.position.set(
      position[0] + currentOffset.current.x,
      position[1] + currentOffset.current.y,
      position[2] + currentOffset.current.z
    );

    // Update shared positions
    creaturePositions.set(data.name, groupRef.current.position);

    // Collision check
    if (!isFrozen && !isExiting) {
      for (const [otherName, otherPos] of creaturePositions.entries()) {
        if (otherName !== data.name) {
          const dist = groupRef.current.position.distanceTo(otherPos);
          if (dist < 2.5) { // collision threshold
            const push = groupRef.current.position.clone().sub(otherPos).normalize();
            // push target offset away from the other creature
            targetOffset.current.add(push.multiplyScalar(dist > 0 ? 0.2 / dist : 0.2));
            // clamp to bounds
            targetOffset.current.clampLength(0, 10);
          }
        }
      }
    }

    const time = performance.now() * 0.001 * animSpeed;
    const yBounce = Math.abs(Math.sin(time)) * squishAmount * 2;
    meshRef.current.position.y = yBounce;

    const squishY = 1 - Math.sin(time) * squishAmount;
    const stretchXZ = 1 + Math.sin(time) * squishAmount * 0.5;
    meshRef.current.scale.set(stretchXZ, Math.max(0.5, squishY), stretchXZ);
    
    // Make creature look towards where it's moving
    if (currentOffset.current.distanceTo(targetOffset.current) > 0.1) {
      const targetRotation = Math.atan2(
        targetOffset.current.x - currentOffset.current.x,
        targetOffset.current.z - currentOffset.current.z
      );
      // Smooth rotation
      let diff = targetRotation - meshRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      meshRef.current.rotation.y += diff * delta * 2;
    }

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (data.maxCpu > HIGH_CPU) {
      mat.emissive.set(displayColor);
      mat.emissiveIntensity = 0.5 + Math.sin(time * 0.5) * 0.2;
    } else if (isSelected) {
      mat.emissive.set(displayColor);
      mat.emissiveIntensity = 0.15 + Math.sin(performance.now() * 0.003) * 0.1;
    } else {
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
    }
  });

  const displayColor = isFrozen ? PALETTE.gray : color;

  const badgeY = targetScale + 0.7;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        if (isExiting) return;
        e.stopPropagation();
        onSelect(data.name);
      }}
    >
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color={displayColor}
          roughness={0.3}
          metalness={0.1}
          envMapIntensity={1.5}
        />
        {/* Cute Face */}
        <group position={[0, 0.1, 0.85]}>
          {/* Eyes */}
          <mesh position={[-0.3, 0.2, 0.1]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
          <mesh position={[0.3, 0.2, 0.1]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
          {/* Eye highlights */}
          <mesh position={[-0.34, 0.24, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.26, 0.24, 0.2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Blush */}
          <mesh position={[-0.45, -0.05, 0.05]} scale={[1.5, 0.8, 0.5]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ff9999" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.45, -0.05, 0.05]} scale={[1.5, 0.8, 0.5]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ff9999" transparent opacity={0.6} />
          </mesh>
          {/* Glasses */}
          {hasGlasses && (
            <group position={[0, 0.2, 0.15]}>
              <mesh position={[-0.3, 0, 0]}>
                <torusGeometry args={[0.18, 0.04, 8, 16]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh position={[0.3, 0, 0]}>
                <torusGeometry args={[0.18, 0.04, 8, 16]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            </group>
          )}

        </group>

        {/* Hair */}
        {hairType === "short" && (
          <mesh position={[0, 0.95, 0]} scale={[1.05, 0.3, 1.05]}>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        )}
        {hairType === "long" && (
          <mesh position={[0, 0.8, -0.4]} scale={[1.1, 0.8, 0.7]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        )}

        {/* Hat */}
        {hasHat && (
          <group position={[0, 1.0, 0]} rotation={[-0.1, 0, 0]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.6, 16]} />
              <meshStandardMaterial color="#222222" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
              <meshStandardMaterial color="#222222" roughness={0.9} />
            </mesh>
          </group>
        )}

        {/* Shirt */}
        {hasShirt && (
          <mesh position={[0, -0.5, 0]} scale={[1.02, 0.6, 1.02]}>
            <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color={shirtColor} roughness={0.8} />
          </mesh>
        )}
      </mesh>

      {/* Talk Bubble */}
      {talkBubble && (
        <group position={[0, targetScale + 2.0, 0]}>
          <RoundedBox args={[2.5, 0.8, 0.1]} radius={0.2} smoothness={4}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </RoundedBox>
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.25}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.4}
            textAlign="center"
          >
            {talkBubble}
          </Text>
        </group>
      )}

      {/* Scale indicator sphere */}
      <mesh position={[0, targetScale * 0.8, 0]} scale={targetScale * 0.15}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={displayColor}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={isFrozen ? 0.3 : 0.7}
        />
      </mesh>

      {/* Name label */}
      <Text
        position={[0, targetScale + 1.3, 0]}
        fontSize={0.38}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.08}
        outlineColor="#000000"
        fontWeight="bold"
      >
        {data.name}
      </Text>

      {/* Stats badge */}
      <Text
        position={[0, badgeY, 0]}
        fontSize={0.24}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.06}
        outlineColor="#000000"
      >
        {data.count > 1
          ? `x${data.count} | CPU ${data.maxCpu.toFixed(1)}% | ${(data.totalMemory / 1024 / 1024).toFixed(0)} MB`
          : `CPU ${data.maxCpu.toFixed(1)}% | ${(data.totalMemory / 1024 / 1024).toFixed(0)} MB`}
      </Text>
    </group>
  );
}
