import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Cloud, Sky } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GrassFloor } from "./GrassFloor";
import { CreatureSpawner } from "./CreatureSpawner";
import { CameraRig } from "./CameraRig";
import { Surroundings } from "../surroundings/Surroundings";
import { useGardenStore } from "../../stores/gardenStore";
import { WeatherSystem } from "../effects/WeatherSystem";

export function GardenScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 20], fov: 50, near: 0.1, far: 2000 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#87CEEB"]} />

      <WeatherSystem />
      <Suspense fallback={null}>
        <Environment preset="sunset" background={false} />
      </Suspense>


      <GrassFloor />

      <CreatureSpawner />

      {/* Surroundings: ocean, islands, sea creatures */}
      <Surroundings />

      {/* Invisible plane to catch clicks for deselection */}
      <mesh
        visible={false}
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => useGardenStore.getState().selectCreature(null)}
      >
        <planeGeometry args={[100, 100]} />
      </mesh>

      <CameraRig />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          intensity={0.5}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
