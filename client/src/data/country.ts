import raw from "./countries.json";

export interface Country {
  cca2: string;
  cca3: string;
  name: string;
  continent: string;
  capital: string | null;
  population: number;
  area: number; // km²
  languages: string[];
  currencies: string[];
  flagUrl: string;
  religion: string | null; // null = no clear majority (e.g. Japan, Czechia)
  governmentType: string | null; // null = no data (e.g. Montenegro, South Sudan)
  borderCount: number;
}

export const countries: Country[] = raw as Country[];
