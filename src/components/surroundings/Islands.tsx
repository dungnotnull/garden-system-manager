import { PalmTree } from "./PalmTree";

interface IslandConfig {
  position: [number, number, number];
  scale: number;
  palms: Array<{ offset: [number, number, number]; lean: number }>;
}

const ISLANDS: IslandConfig[] = [
  {
    position: [-30, -1.8, -20],
    scale: 5,
    palms: [
      { offset: [0, 2, 0], lean: 0.1 },
      { offset: [1.5, 1.8, 0.5], lean: -0.2 },
    ],
  },
  {
    position: [28, -1.8, -25],
    scale: 6,
    palms: [
      { offset: [0, 2.4, 0], lean: 0.15 },
      { offset: [-1, 2.2, 1], lean: -0.1 },
      { offset: [1.8, 2, -0.5], lean: 0.25 },
    ],
  },
  {
    position: [10, -1.8, -35],
    scale: 4,
    palms: [{ offset: [0, 1.6, 0], lean: 0.2 }],
  },
  {
    position: [-18, -1.8, 30],
    scale: 3.5,
    palms: [{ offset: [0, 1.4, 0], lean: -0.15 }],
  },
  {
    position: [35, -1.8, 15],
    scale: 4.5,
    palms: [
      { offset: [0.5, 1.8, -0.5], lean: 0.2 },
      { offset: [-0.5, 1.6, 0.5], lean: -0.1 },
    ],
  },
  {
    position: [-40, -1.8, 10],
    scale: 5.5,
    palms: [
      { offset: [1, 2.2, 0], lean: -0.15 },
      { offset: [-1.2, 2.0, -1], lean: 0.1 },
    ],
  },
];

function Island({ config }: { config: IslandConfig }) {
  const { position, scale, palms } = config;

  return (
    <group position={position}>
      {/* Sandy base */}
      <mesh scale={[scale, scale * 0.35, scale * 0.8]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#E8C97A" roughness={0.9} />
      </mesh>

      {/* Green top */}
      <mesh
        position={[0, scale * 0.12, 0]}
        scale={[scale * 0.85, scale * 0.28, scale * 0.7]}
      >
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#7EC882" roughness={0.8} />
      </mesh>

      {/* Rocks */}
      <mesh position={[scale * 0.6, scale * 0.15, scale * 0.3]} rotation={[0.2, 0.4, 0.1]} scale={[scale * 0.2, scale * 0.15, scale * 0.2]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>
      <mesh position={[-scale * 0.5, scale * 0.1, scale * 0.4]} rotation={[-0.1, 0.2, -0.3]} scale={[scale * 0.15, scale * 0.1, scale * 0.15]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#999999" roughness={0.9} />
      </mesh>

      {/* Little Bushes */}
      <mesh position={[scale * 0.3, scale * 0.25, -scale * 0.4]} scale={[scale * 0.15, scale * 0.15, scale * 0.15]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#4A8B51" roughness={0.9} />
      </mesh>
      <mesh position={[scale * 0.4, scale * 0.2, -scale * 0.3]} scale={[scale * 0.1, scale * 0.1, scale * 0.1]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#4A8B51" roughness={0.9} />
      </mesh>

      {/* Palm trees */}
      {palms.map((palm, i) => (
        <PalmTree
          key={i}
          position={palm.offset}
          lean={palm.lean}
          height={scale * 0.8}
        />
      ))}
    </group>
  );
}

export function Islands() {
  return (
    <>
      {ISLANDS.map((config, i) => (
        <Island key={i} config={config} />
      ))}
    </>
  );
}
