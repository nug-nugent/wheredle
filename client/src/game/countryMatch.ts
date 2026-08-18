import { countries, type Country } from "../data/country";

const DIACRITIC_MARKS = /[̀-ͯ]/g;

export function normalizeCountryName(value: string): string {
  return value.normalize("NFD").replace(DIACRITIC_MARKS, "").toLowerCase().trim();
}

export const MIN_SEARCH_LENGTH = 3;
export const COUNTRY_NAMES = countries.map((c) => c.name);
const BY_NORMALIZED_NAME = new Map(countries.map((c) => [normalizeCountryName(c.name), c]));

export function findCountryByName(value: string): Country | undefined {
  return BY_NORMALIZED_NAME.get(normalizeCountryName(value));
}
