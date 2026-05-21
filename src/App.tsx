import { useProcessStream } from "./hooks/useProcessStream";
import { useGardenStore } from "./stores/gardenStore";
import { GardenScene } from "./components/garden/GardenScene";
import { GardenLoading } from "./components/loading/GardenLoading";
import { OverlayHUD } from "./components/hud/OverlayHUD";

function App() {
  useProcessStream();
  const isInitialLoad = useGardenStore((s) => s.isInitialLoad);

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <GardenScene />
      {isInitialLoad ? <GardenLoading /> : <OverlayHUD />}
    </div>
  );
}

export default App;
