import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Cloud, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export type WeatherType = "sunny" | "rainy" | "stormy" | "snowy";

export function WeatherSystem() {
  const [weather, setWeather] = useState<WeatherType>("sunny");

  // Randomly change weather every 30-60 seconds
  useEffect(() => {
    const changeWeather = () => {
      const weathers: WeatherType[] = ["sunny", "rainy", "stormy", "snowy"];
      const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(nextWeather);
      
      const nextTimeout = 30000 + Math.random() * 30000;
      setTimeout(changeWeather, nextTimeout);
    };

    const timeout = setTimeout(changeWeather, 10000); // First change after 10s
    return () => clearTimeout(timeout);
  }, []);

  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const skyRef = useRef<any>(null);
  const lightningRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    let targetIntensity = 1.2;
    let targetAmbient = 0.5;

    switch (weather) {
      case "rainy":
        targetIntensity = 0.6;
        targetAmbient = 0.3;
        break;
      case "stormy":
        targetIntensity = 0.3;
        targetAmbient = 0.2;
        break;
      case "snowy":
        targetIntensity = 0.8;
        targetAmbient = 0.6;
        break;
      case "sunny":
      default:
        targetIntensity = 1.2;
        targetAmbient = 0.5;
        break;
    }

    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = THREE.MathUtils.lerp(
        directionalLightRef.current.intensity,
        targetIntensity,
        delta * 0.5
      );
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbient,
        delta * 0.5
      );
    }
    
    // Lightning effect
    if (weather === "stormy" && lightningRef.current) {
      if (Math.random() > 0.98) {
        lightningRef.current.intensity = 50 + Math.random() * 100;
      } else {
        lightningRef.current.intensity = THREE.MathUtils.lerp(lightningRef.current.intensity, 0, delta * 10);
      }
    }
  });

  return (
    <>
      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[100, weather === "sunny" ? 20 : 5, 50]} // rough transition via rerender/lerp internally if supported
        inclination={0.5}
        azimuth={0.25}
        rayleigh={weather === "stormy" ? 6 : weather === "rainy" ? 4 : 2}
        turbidity={weather === "stormy" ? 20 : weather === "rainy" ? 15 : 8}
      />

      <ambientLight ref={ambientLightRef} intensity={0.6} color="#FFF5E4" />

      <directionalLight
        ref={directionalLightRef}
        position={[8, 15, 8]}
        intensity={1.8}
        color="#FFF8D0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      <hemisphereLight
        color="#FFF5E4"
        groundColor="#4BA3C7"
        intensity={0.3}
      />

      {weather === "stormy" && (
        <pointLight ref={lightningRef} position={[0, 50, 0]} color="#ffffff" intensity={0} distance={200} />
      )}

      {/* Sun glow for sunny weather */}
      {weather === "sunny" && (
        <mesh position={[100, 20, 50]} scale={10}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#FFF5B8" />
          <pointLight intensity={2} color="#FFF5B8" distance={500} />
        </mesh>
      )}

      {/* Clouds */}
      <group>
        <Cloud
          position={[-20, 25, -15]}
          speed={weather === "stormy" ? 0.6 : 0.2}
          opacity={weather === "sunny" ? 0.4 : 0.8}
          color={weather === "stormy" ? "#555555" : weather === "rainy" ? "#888888" : "#FFF8F0"}
        />
        <Cloud
          position={[25, 28, -25]}
          speed={weather === "stormy" ? 0.45 : 0.15}
          opacity={weather === "sunny" ? 0.35 : 0.7}
          color={weather === "stormy" ? "#444444" : weather === "rainy" ? "#777777" : "#FFF8F0"}
        />
        <Cloud
          position={[0, 22, -30]}
          speed={weather === "stormy" ? 0.3 : 0.1}
          opacity={weather === "sunny" ? 0.3 : 0.9}
          color={weather === "stormy" ? "#666666" : weather === "rainy" ? "#999999" : "#FFF8F0"}
        />
        {(weather === "rainy" || weather === "stormy") && (
          <Cloud
            position={[10, 15, 0]}
            speed={0.5}
            opacity={0.5}
            color="#555555"
          />
        )}
      </group>

      {/* Precipitation */}
      {(weather === "rainy" || weather === "stormy") && (
        <RainDrops stormy={weather === "stormy"} />
      )}
      {weather === "snowy" && (
        <Sparkles
          count={2000}
          scale={[100, 50, 100]}
          position={[0, 20, 0]}
          speed={0.3}
          opacity={0.8}
          color="#ffffff"
          size={5}
          noise={1}
        />
      )}
    </>
  );
}

function RainDrops({ stormy }: { stormy: boolean }) {
  const count = stormy ? 3000 : 1000;
  const speed = stormy ? 30 : 15;
  const positions = new Float32Array(count * 3);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= speed * delta;
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 50;
      }
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      if (stormy) dummy.rotation.z = 0.2; // slight angle
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.05, stormy ? 1.5 : 0.8]} />
      <meshBasicMaterial color="#aaccff" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
