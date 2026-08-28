// Derives each country's Köppen-Geiger climate zones for the climate
// category. Used by fetch-countries.mjs; see the provenance note below
// before changing a source URL.
//
// Sources:
//  - Köppen grid: the Vienna (Kottek et al. 2006 / Rubel & Kottek 2010)
//    0.5° world map, 92,415 land cells as lat,lon,class. The original host
//    (koeppen-geiger.vu-wien.ac.at) has been unreachable, so this reads a
//    GitHub mirror. The mirror repo's own ISC licence covers its wrapper
//    code, not the grid — the grid is free to use with citation to Kottek
//    and Rubel.
//  - Country outlines: Natural Earth 50m admin-0. Its "countries" layer
//    folds overseas departments into the sovereign state (French Guiana
//    counts as France) but keeps Greenland separate from Denmark, which is
//    the split this game wants in both cases.
//
// The alternative source is Beck et al. (2023), which is newer, 1 km and
// unambiguously CC BY 4.0 — but ships as GeoTIFF, so using it would mean a
// raster dependency for a build step that currently needs none.

const KOPPEN_GRID_URL =
  "https://raw.githubusercontent.com/andreigec/koppen-climate-lookup/master/src/koppen.csv";
const OUTLINES_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

// The share of a country's land a zone must cover to be listed. This is a
// judgement, not a fact: at 0.10 Brazil picks up a temperate south it isn't
// really known for, and at 0.20 Canada loses an Arctic that is a third of
// the country. 0.15 leaves 138 of 194 countries single-zoned while giving
// the genuinely varied ones their honest spread — China arid/temperate/
// continental/polar, the United States arid/temperate/continental.
//
// Raising it makes guesses more informative, since fewer zones means fewer
// accidental overlaps, at the cost of calling large countries by one zone
// they are only mostly. That trade is the whole design of this category, so
// move it deliberately.
const LAND_SHARE_THRESHOLD = 0.15;

// Köppen's first letter is the main climate group; the finer classes (Cfb,
// BWh, Dfc and so on) run to about thirty values, which is far too many for
// a category whose exclusions are meant to narrow the field.
export const CLIMATE_GROUPS = ["A", "B", "C", "D", "E"];

function boundingBox(ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

// Ray casting. Good enough here because the grid cells being tested are half
// a degree apart, so a point landing exactly on an edge — the case this gets
// wrong — is vanishingly unlikely and would misfile a single cell.
function insideRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function insidePolygon(x, y, polygon) {
  const [minX, minY, maxX, maxY] = polygon.bbox;
  if (x < minX || x > maxX || y < minY || y > maxY) return false;
  if (!insideRing(x, y, polygon.rings[0])) return false;
  // Any further ring is a hole — a point inside one is outside the polygon.
  for (let i = 1; i < polygon.rings.length; i++) {
    if (insideRing(x, y, polygon.rings[i])) return false;
  }
  return true;
}

async function loadGrid() {
  const csv = await fetch(KOPPEN_GRID_URL).then((r) => r.text());
  // The file carries a byte-order mark and a header row.
  return csv
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => {
      const [lat, lon, cls] = row.trim().split(",");
      return { lat: Number(lat), lon: Number(lon), group: cls[0] };
    });
}

async function loadOutlines(wanted) {
  const geo = await fetch(OUTLINES_URL).then((r) => r.json());
  const byCca3 = new Map();
  for (const feature of geo.features) {
    // ISO_A3_EH resolves the disputed cases the plain ISO_A3 column leaves
    // as -99; ADM0_A3 is the last resort.
    const { ISO_A3_EH, ADM0_A3 } = feature.properties;
    const cca3 = ISO_A3_EH && ISO_A3_EH !== "-99" ? ISO_A3_EH : ADM0_A3;
    if (!wanted.has(cca3) || !feature.geometry) continue;

    const parts =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    const polygons = byCca3.get(cca3) ?? [];
    for (const rings of parts) polygons.push({ rings, bbox: boundingBox(rings[0]) });
    byCca3.set(cca3, polygons);
  }
  return byCca3;
}

// Zones covering at least LAND_SHARE_THRESHOLD of the country, in canonical
// A–E order so two countries with the same zones always produce the same
// list — the daily draw compares these as strings to work out which
// countries a board can tell apart. Never returns empty: a country whose
// zones all fall below the threshold keeps its largest.
function zonesFromCounts(counts) {
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const above = CLIMATE_GROUPS.filter((g) => (counts.get(g) ?? 0) / total >= LAND_SHARE_THRESHOLD);
  if (above.length > 0) return above;
  return [[...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]];
}

/**
 * Works out the climate zones for each country.
 *
 * @param {{ cca3: string, name: string, latlng: [number, number] }[]} countries
 * @returns {Promise<Map<string, string[]>>} cca3 to zone letters, in A–E order
 */
export async function deriveClimateZones(countries) {
  const wanted = new Set(countries.map((c) => c.cca3));
  const [grid, outlines] = await Promise.all([loadGrid(), loadOutlines(wanted)]);

  const missingOutline = countries.filter((c) => !outlines.has(c.cca3));
  if (missingOutline.length > 0) {
    throw new Error(
      `No Natural Earth outline for: ${missingOutline.map((c) => `${c.name} (${c.cca3})`).join(", ")}`
    );
  }

  // One pass over the grid rather than one per country: each land cell
  // belongs to at most one country, so the first outline to claim it wins
  // and the remaining countries needn't be tested at all.
  const counts = new Map();
  for (const cell of grid) {
    for (const [cca3, polygons] of outlines) {
      if (!polygons.some((p) => insidePolygon(cell.lon, cell.lat, p))) continue;
      const forCountry = counts.get(cca3) ?? new Map();
      forCountry.set(cell.group, (forCountry.get(cell.group) ?? 0) + 1);
      counts.set(cca3, forCountry);
      break;
    }
  }

  const zones = new Map();
  const fallbacks = [];
  for (const country of countries) {
    const forCountry = counts.get(country.cca3);
    if (forCountry) {
      zones.set(country.cca3, zonesFromCounts(forCountry));
      continue;
    }

    // Two dozen microstates and small island nations are smaller than a
    // 0.5° cell and claim none, so they take the nearest cell instead. All
    // of them are single-zone in reality, so a nearest-cell answer is the
    // right shape even where the cell is some way offshore — but the
    // distance is reported, because a far one is worth a human's eye.
    const [lat, lon] = country.latlng;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const cell of grid) {
      const dLat = cell.lat - lat;
      const dLon = (cell.lon - lon) * Math.cos((lat * Math.PI) / 180);
      const distance = dLat * dLat + dLon * dLon;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = cell;
      }
    }
    zones.set(country.cca3, [nearest.group]);
    fallbacks.push(
      `${country.name} → ${nearest.group} (${Math.sqrt(nearestDistance).toFixed(1)}° away)`
    );
  }

  if (fallbacks.length > 0) {
    console.log(`Climate: ${fallbacks.length} countries too small for the grid, took the nearest cell:`);
    for (const line of fallbacks) console.log(`  ${line}`);
  }

  return zones;
}
