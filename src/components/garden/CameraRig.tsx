import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGardenStore } from "../../stores/gardenStore";
import { spiralPositions } from "../../lib/collision";

const DEFAULT_POSITION = new THREE.Vector3(0, 14, 20);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);
const CAMERA_OFFSET = new THREE.Vector3(2, 4, 4);
const LERP_SPEED = 2.5;

export function CameraRig() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const goalPosition = useRef(DEFAULT_POSITION.clone());
  const goalTarget = useRef(DEFAULT_TARGET.clone());

  const processGroups = useGardenStore((s) => s.processGroups);
  const selectedKey = useGardenStore((s) => s.selectedCreatureKey);

  const focusPosition = useMemo((): [number, number, number] | null => {
    if (!selectedKey) return null;
    const index = processGroups.findIndex((g) => g.name === selectedKey);
    if (index === -1) return null;
    const positions = spiralPositions(processGroups.length);
    return positions[index] ?? null;
  }, [selectedKey, processGroups]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const t = 1 - Math.exp(-LERP_SPEED * delta);

    if (focusPosition) {
      goalTarget.current.set(...focusPosition);
      goalPosition.current.set(
        focusPosition[0] + CAMERA_OFFSET.x,
        focusPosition[1] + CAMERA_OFFSET.y,
        focusPosition[2] + CAMERA_OFFSET.z,
      );
    } else {
      goalTarget.current.copy(DEFAULT_TARGET);
      goalPosition.current.copy(DEFAULT_POSITION);
    }

    controls.target.lerp(goalTarget.current, t);
    controls.object.position.lerp(goalPosition.current, t);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={5}
      maxDistance={1000}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      dampingFactor={0.05}
      zoomSpeed={0.8}
      rotateSpeed={0.6}
    />
  );
}
