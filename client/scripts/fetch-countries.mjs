// Regenerates src/data/countries.json from public sources.
// Run with: npm run data:fetch
//
// Sources:
//  - name / continent / languages / capital / borders / currencies: mledoze/countries (dist/countries.json)
//  - population / religion / government type: samayo/country-json
//  - flag images: hjnilsson/country-flags SVGs, served via jsDelivr CDN by cca2 code
//  - climateZones: derived, not fetched — see climate.mjs, which crosses a
//    Köppen-Geiger grid with country outlines. It's the slow part of a
//    re-fetch (a minute or so) because it's real geometry rather than a
//    lookup.
//  - hdi: NOT machine-fetched. There's no maintained JSON source for it, so
//    it was hand-curated from the UNDP 2025 Human Development Report (via
//    Wikipedia's sourced table, cross-checked against the UNDP's own
//    statistical annex). Monaco has a real published figure the UNDP just
//    doesn't fold into its ranking; North Korea and Vatican City have no
//    figure at all, official or unofficial, so those two carry a rough
//    placeholder flagged with hdiEstimated: true. This script preserves
//    whatever hdi/hdiEstimated the existing file has by name rather than
//    dropping them, since a re-fetch has no source to regenerate them from.
//
// mledoze and the samayo datasets key countries by slightly different common
// names in a handful of cases (accents, alternate spellings). The two
// NAME_OVERRIDES maps below cover the cases specific to each dataset — they
// aren't identical because the samayo repo isn't internally consistent about
// naming between its own files (e.g. population's file says "Cabo Verde",
// religion's says "Cape Verde").

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { deriveClimateZones } from "./climate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../src/data/countries.json");

const MLEDOZE_URL =
  "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";
const POPULATION_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";
const RELIGION_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-religion.json";
const GOVERNMENT_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-government-type.json";

const POPULATION_NAME_OVERRIDES = {
  "DR Congo": "The Democratic Republic of Congo",
  "Cape Verde": "Cabo Verde",
  Czechia: "Czech Republic",
  Fiji: "Fiji Islands",
  Micronesia: "Micronesia, Federated States of",
  "São Tomé and Príncipe": "Sao Tome and Principe",
  "Timor-Leste": "East Timor",
  Türkiye: "Turkey",
  "Vatican City": "Holy See (Vatican City State)",
};

const RELIGION_NAME_OVERRIDES = {
  "DR Congo": "The Democratic Republic of Congo",
  Czechia: "Czech Republic",
  Fiji: "Fiji Islands",
  Micronesia: "Micronesia (country)",
  "São Tomé and Príncipe": "Sao Tome and Principe",
  "Timor-Leste": "Timor",
  Türkiye: "Turkey",
  "Vatican City": "Vatican",
};

// Unlike population/religion, this dataset already uses "Cape Verde" (matching
// mledoze directly), so no override is needed for it here. Montenegro isn't in
// this dataset at all — it ends up with governmentType: null.
const GOVERNMENT_NAME_OVERRIDES = {
  "DR Congo": "The Democratic Republic of Congo",
  Czechia: "Czech Republic",
  Fiji: "Fiji Islands",
  Micronesia: "Micronesia, Federated States of",
  "São Tomé and Príncipe": "Sao Tome and Principe",
  "Timor-Leste": "East Timor",
  Türkiye: "Turkey",
  "Vatican City": "Holy See (Vatican City State)",
};

// mledoze's common name isn't always the one the game wants to show. These
// renames apply to the written-out name only — the lookups above still key
// off mledoze's own spelling, and so do the override maps.
const DISPLAY_NAME_OVERRIDES = {
  "Cape Verde": "Cabo Verde",
  "Ivory Coast": "Côte d'Ivoire",
};

function flagUrl(cca2) {
  return `https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/${cca2.toLowerCase()}.svg`;
}

async function main() {
  const existing = JSON.parse(await readFile(OUT_PATH, "utf-8"));
  const hdiByName = new Map(
    existing.map((c) => [c.name, { hdi: c.hdi, hdiEstimated: c.hdiEstimated }])
  );

  const [countries, population, religion, government] = await Promise.all([
    fetch(MLEDOZE_URL).then((r) => r.json()),
    fetch(POPULATION_URL).then((r) => r.json()),
    fetch(RELIGION_URL).then((r) => r.json()),
    fetch(GOVERNMENT_URL).then((r) => r.json()),
  ]);

  const popByName = new Map(
    population.map((p) => [p.country.toLowerCase(), p.population])
  );
  const religionByName = new Map(
    religion.map((r) => [r.country.toLowerCase(), r.religion])
  );
  const governmentByName = new Map(
    government.map((g) => [g.country.toLowerCase(), g.government])
  );

  const result = [];
  const climateInputs = [];
  const missing = [];

  for (const c of countries) {
    if (!c.independent || !c.unMember) continue;

    const commonName = c.name.common;
    const popLookupName = POPULATION_NAME_OVERRIDES[commonName] ?? commonName;
    const pop = popByName.get(popLookupName.toLowerCase());

    if (pop === undefined) {
      missing.push(commonName);
      continue;
    }

    const religionLookupName = RELIGION_NAME_OVERRIDES[commonName] ?? commonName;
    const religionValue = religionByName.get(religionLookupName.toLowerCase()) ?? null;

    const governmentLookupName = GOVERNMENT_NAME_OVERRIDES[commonName] ?? commonName;
    const governmentType = governmentByName.get(governmentLookupName.toLowerCase()) ?? null;

    // The existing file is keyed by display name, since that's what it was
    // written with — look hdi up under the rename, not mledoze's spelling.
    const name = DISPLAY_NAME_OVERRIDES[commonName] ?? commonName;
    const hdi = hdiByName.get(name);
    if (hdi === undefined) {
      throw new Error(
        `No hdi entry for "${name}" in the existing file — add one by hand, see the hdi note at the top of this script.`
      );
    }

    // Filled in below, once every country is known: the derivation walks a
    // global grid once and hands back the lot, rather than being asked
    // country by country. Assigning to the key later leaves it in this
    // position, which keeps the written file's field order stable.
    climateInputs.push({ cca3: c.cca3, name, latlng: c.latlng });

    result.push({
      cca2: c.cca2,
      cca3: c.cca3,
      name,
      continent: c.region,
      climateZones: null,
      capital: c.capital?.[0] ?? null,
      population: pop,
      area: c.area,
      languages: Object.values(c.languages ?? {}),
      currencies: Object.values(c.currencies ?? {}).map((cur) => cur.name),
      flagUrl: flagUrl(c.cca2),
      religion: religionValue,
      governmentType,
      borderCount: (c.borders ?? []).length,
      hdi: hdi.hdi,
      ...(hdi.hdiEstimated ? { hdiEstimated: hdi.hdiEstimated } : {}),
    });
  }

  const climateZones = await deriveClimateZones(climateInputs);
  for (const country of result) country.climateZones = climateZones.get(country.cca3);

  result.sort((a, b) => a.name.localeCompare(b.name));

  if (missing.length > 0) {
    console.warn(
      `Skipped ${missing.length} countries with no population match:`,
      missing
    );
  }

  await writeFile(OUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${result.length} countries to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
