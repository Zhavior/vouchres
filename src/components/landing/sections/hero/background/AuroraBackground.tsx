import { AuroraField } from "./AuroraField";
import { StadiumLayer } from "./StadiumLayer";
import { AuroraAtmosphere } from "./AuroraAtmosphere";
import { SportMemory } from "./SportMemory";

export function AuroraBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AuroraField />
      <StadiumLayer />
      <AuroraAtmosphere />
      <SportMemory />
    </div>
  );
}
