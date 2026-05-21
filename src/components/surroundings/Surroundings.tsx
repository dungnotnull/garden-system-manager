import { Ocean } from "./Ocean";
import { Islands } from "./Islands";
import { SeaCreatures } from "./SeaCreatures";
import { OceanEntities } from "./OceanEntities";

export function Surroundings() {
  return (
    <>
      <Ocean />
      <Islands />
      <SeaCreatures />
      <OceanEntities />
    </>
  );
}
