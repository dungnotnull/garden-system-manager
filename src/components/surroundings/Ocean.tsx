import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const basePositions = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    basePositions.current = new Float32Array(geo.attributes.position.array);
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !basePositions.current) return;
    const time = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    const base = basePositions.current;

    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const wave =
        Math.sin(x * 0.15 + time * 1.5) * 1.2 +
        Math.cos(y * 0.12 + time * 0.8) * 0.8 +
        Math.sin((x + y) * 0.08 + time * 0.5) * 0.6;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[400, 400, 100, 100]} />
      <meshPhysicalMaterial
        color="#38BDF8"
        transmission={0.6}
        opacity={1}
        metalness={0.2}
        roughness={0.1}
        ior={1.4}
        thickness={2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
