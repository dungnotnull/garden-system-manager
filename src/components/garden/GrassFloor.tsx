import { useMemo } from "react";
import * as THREE from "three";

function SimpleTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1]} />
        <meshStandardMaterial color="#5c3a21" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial color="#4A8B51" />
      </mesh>
    </group>
  );
}

function GrassTuft({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.random() * Math.PI, 0]}>
        <coneGeometry args={[0.05, 0.4, 4]} />
        <meshStandardMaterial color="#4A8B51" />
      </mesh>
      <mesh position={[0.05, 0.15, 0]} rotation={[0, Math.random() * Math.PI, 0.2]}>
        <coneGeometry args={[0.05, 0.3, 4]} />
        <meshStandardMaterial color="#4A8B51" />
      </mesh>
      <mesh position={[-0.05, 0.15, 0]} rotation={[0, Math.random() * Math.PI, -0.2]}>
        <coneGeometry args={[0.05, 0.3, 4]} />
        <meshStandardMaterial color="#4A8B51" />
      </mesh>
    </group>
  );
}

function SimpleAnimal({ position, color, type }: { position: [number, number, number], color: string, type: string }) {
  return (
    <group position={position}>
      {type === 'rabbit' && (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {type === 'deer' && (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.8, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {type === 'elephant' && (
        <group position={[0, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 1.2, 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* trunk */}
          <mesh position={[0.6, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function IslandBird({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <coneGeometry args={[0.1, 0.3, 4]} />
      <meshBasicMaterial color="#222222" />
    </mesh>
  );
}

export function GrassFloor() {
  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(14, 64);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const edgeGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(14, 13.5, 1.2, 64, 1, true);
    return geo;
  }, []);

  const trees = [
    [-11, 0, -6], [9, 0, -9], [-8, 0, 9], [11, 0, 5], [-5, 0, -11]
  ] as [number, number, number][];

  const animals = [
    { p: [-5, 0, -6], c: '#C19A6B', t: 'deer' },
    { p: [6, 0, 5], c: '#ffffff', t: 'rabbit' },
    { p: [-6, 0, 6], c: '#888888', t: 'elephant' },
    { p: [4, 0, -5], c: '#ffffff', t: 'rabbit' },
    { p: [8, 0, -2], c: '#eeeeee', t: 'rabbit' },
    { p: [-2, 0, 8], c: '#D2B48C', t: 'deer' },
    { p: [0, 0, -10], c: '#ffffff', t: 'rabbit' },
    { p: [-9, 0, 2], c: '#A0A0A0', t: 'elephant' },
  ] as const;

  const birds = [
    [-2, 4, -5], [3, 5, 2], [-4, 6, 4], [0, 8, 0]
  ] as [number, number, number][];

  const grassPatches = useMemo(() => {
    return Array.from({ length: 150 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 12; 
      return [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number];
    });
  }, []);

  return (
    <group position={[0, -0.02, 0]}>
      {/* Lawn top surface */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#4ADE80"
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scenery */}
      {grassPatches.map((p, i) => <GrassTuft key={`g${i}`} position={p} />)}
      {trees.map((p, i) => <SimpleTree key={`t${i}`} position={p} />)}
      {animals.map((a, i) => <SimpleAnimal key={`a${i}`} position={a.p as [number, number, number]} color={a.c} type={a.t} />)}
      {birds.map((p, i) => <IslandBird key={`b${i}`} position={p} />)}

      {/* Dirt/earth edge visible from below */}
      <mesh geometry={edgeGeometry} position={[0, -0.6, 0]}>
        <meshStandardMaterial
          color="#8B6D42"
          roughness={0.95}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bottom cap */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[13.5, 64]} />
        <meshStandardMaterial
          color="#7A5D38"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
