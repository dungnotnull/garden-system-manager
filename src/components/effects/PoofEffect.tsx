import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 16;
const DURATION = 0.8;

interface PoofEffectProps {
  id: string;
  position: [number, number, number];
  color: string;
  onDone: (id: string) => void;
}

export function PoofEffect({ id, position, color, onDone }: PoofEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTime = useRef(performance.now() / 1000);
  const done = useRef(false);

  const velocities = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.7;
        const speed = 1.5 + Math.random() * 3;
        return new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.abs(Math.cos(phi)) * speed + 0.5,
          Math.sin(phi) * Math.sin(theta) * speed,
        );
      }),
    [],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Safety cleanup: remove dying effect if component unmounts before animation ends
  useEffect(() => {
    return () => {
      if (!done.current) {
        onDone(id);
      }
    };
  }, [id, onDone]);

  useFrame(() => {
    if (!meshRef.current || done.current) return;

    const elapsed = performance.now() / 1000 - startTime.current;
    const t = Math.min(elapsed / DURATION, 1);

    if (t >= 1) {
      done.current = true;
      onDone(id);
      return;
    }

    const easeOut = 1 - (1 - t) * (1 - t);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const v = velocities[i];
      dummy.position.set(v.x * easeOut, v.y * easeOut, v.z * easeOut);
      dummy.scale.setScalar(Math.max(0.01, 0.2 * (1 - t * t)));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 1 - t * t;
  });

  return (
    <group position={position}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, PARTICLE_COUNT]}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
