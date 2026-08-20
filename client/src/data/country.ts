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
  hdi: number; // UNDP Human Development Index, most recent report
  // true only for North Korea and Vatican City, neither of which the UNDP
  // publishes an HDI for — their value is a rough unofficial estimate rather
  // than a reported figure, and the UI marks it as such.
  hdiEstimated?: true;
}

export const countries: Country[] = raw as Country[];
