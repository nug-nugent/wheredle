import raw from "./countries.json";

// PERSISTED. Saved games hold whole Country objects, so a save written by an
// older build contains an older version of this type — adding a field here is
// a storage change, however local it looks. Both resume() functions rebuild
// countries from their codes so a stale save repairs itself; see the save
// contract in CLAUDE.md before changing that.
export interface Country {
  cca2: string;
  cca3: string;
  name: string;
  continent: string;
  // Köppen-Geiger main groups (A–E) covering at least a sixth of the
  // country's land, in A–E order, never empty. Multi-valued because most
  // large countries genuinely span several — China has four — and naming
  // only the largest would put a falsehood on a board whose every tile is
  // meant to be a hard fact. See scripts/climate.mjs for the derivation and
  // the threshold behind "at least a sixth".
  climateZones: string[];
  capital: string | null;
  population: number;
  area: number; // km²
  languages: string[];
  currencies: string[];
  flagUrl: string;
  religion: string | null; // null = no clear majority (e.g. Japan, Czechia)
  governmentType: string | null; // null = no data (e.g. Montenegro, South Sudan)
  borderCount: number;
  hdi: number; // UNDP Human Development Index, most recent report
  // true only for North Korea and Vatican City, neither of which the UNDP
  // publishes an HDI for — their value is a rough unofficial estimate rather
  // than a reported figure, and the UI marks it as such.
  hdiEstimated?: true;
}

// The data stores Köppen's letters; nobody wants to be told their country
// is "D". Lives here rather than with the Alex categories because the
// end-of-game reveal names them too, and that is shared by both modes.
export const CLIMATE_ZONES = ["A", "B", "C", "D", "E"];
export const CLIMATE_ZONE_LABEL: Record<string, string> = {
  A: "Tropical",
  B: "Arid",
  C: "Temperate",
  D: "Continental",
  E: "Polar",
};

export function climateLabel(zones: string[]): string {
  return CLIMATE_ZONES.filter((z) => zones.includes(z))
    .map((z) => CLIMATE_ZONE_LABEL[z] ?? z)
    .join(", ");
}

export const countries: Country[] = raw as Country[];
