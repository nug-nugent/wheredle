// Regenerates src/data/countries.json from public sources.
// Run with: npm run data:fetch
//
// Sources:
//  - name / continent / languages / capital / borders / currencies: mledoze/countries (dist/countries.json)
//  - population / religion / government type: samayo/country-json
//  - flag images: hjnilsson/country-flags SVGs, served via jsDelivr CDN by cca2 code
//
// mledoze and the samayo datasets key countries by slightly different common
// names in a handful of cases (accents, alternate spellings). The two
// NAME_OVERRIDES maps below cover the cases specific to each dataset — they
// aren't identical because the samayo repo isn't internally consistent about
// naming between its own files (e.g. population's file says "Cabo Verde",
// religion's says "Cape Verde").

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

function flagUrl(cca2) {
  return `https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/${cca2.toLowerCase()}.svg`;
}

async function main() {
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

    result.push({
      cca2: c.cca2,
      cca3: c.cca3,
      name: commonName,
      continent: c.region,
      capital: c.capital?.[0] ?? null,
      population: pop,
      area: c.area,
      languages: Object.values(c.languages ?? {}),
      currencies: Object.values(c.currencies ?? {}).map((cur) => cur.name),
      flagUrl: flagUrl(c.cca2),
      religion: religionValue,
      governmentType,
      borderCount: (c.borders ?? []).length,
    });
  }

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
