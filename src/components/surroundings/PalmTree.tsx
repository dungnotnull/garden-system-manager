import { useMemo } from "react";
import * as THREE from "three";

interface PalmTreeProps {
  position: [number, number, number];
  lean?: number;
  height?: number;
}

export function PalmTree({ position, lean = 0.1, height = 2.5 }: PalmTreeProps) {
  const leafRotations = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        angle: (i * Math.PI * 2) / 6,
        tilt: 0.4 + Math.random() * 0.3,
      })),
    [],
  );

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.5, 0]} rotation={[0, 0, lean]}>
        <cylinderGeometry args={[0.06, 0.1, height, 6]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>

      {/* Trunk top cap */}
      <mesh
        position={[Math.sin(lean) * height, height * 0.95, 0]}
      >
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#7A5B10" roughness={0.8} />
      </mesh>

      {/* Leaves */}
      {leafRotations.map((leaf, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(lean) * height * 0.9,
            height * 0.9,
            0,
          ]}
          rotation={[leaf.tilt, leaf.angle, 0]}
        >
          <coneGeometry args={[0.2, 1.2, 3]} />
          <meshStandardMaterial
            color="#4DB84D"
            roughness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
