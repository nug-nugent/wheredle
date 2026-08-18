import type { Country } from "../data/country";
import { COLORS, FONT_FAMILY } from "../theme";

export function CountryReveal({ country }: { country: Country }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", fontFamily: FONT_FAMILY }}>
      <img
        src={country.flagUrl}
        alt={`Flag of ${country.name}`}
        style={{ width: 240, height: 144, objectFit: "contain", border: `1px solid ${COLORS.border}` }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{country.name}</span>
        <span
          style={{
            border: `1px solid ${COLORS.accent}`,
            color: COLORS.accent,
            fontSize: 11,
            letterSpacing: "0.04em",
            padding: "4px 10px",
            width: "fit-content",
          }}
        >
          {country.continent}
        </span>
        <span style={{ fontSize: 13 }}>
          <strong>Capital:</strong> {country.capital ?? "—"}
        </span>
        <span style={{ fontSize: 13 }}>
          <strong>Population:</strong> {country.population.toLocaleString()}
        </span>
        <span style={{ fontSize: 13 }}>
          <strong>Language(s):</strong> {country.languages.join(", ")}
        </span>
      </div>
    </div>
  );
}
