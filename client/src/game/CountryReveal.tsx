import { Fragment } from "react";
import type { Country } from "../data/country";
import { COLORS, FONT_FAMILY } from "../theme";
import { FlagImage } from "./FlagImage";

const formatNumber = (n: number) => n.toLocaleString("en-GB");

// The attributes worth settling once the country is known. Name length is
// deliberately absent: it is a guessing aid, not a fact anyone wants read
// back to them beside the answer. Nulls in the data mean genuinely
// different things per field (no capital, no clear religious majority, no
// government type recorded), so each says so in its own words instead of a
// shared dash.
function factsFor(country: Country): { label: string; value: string }[] {
  return [
    { label: "Capital", value: country.capital ?? "None" },
    { label: "Population", value: formatNumber(country.population) },
    { label: "Land area", value: `${formatNumber(country.area)} km²` },
    {
      label: "Land borders",
      value:
        country.borderCount === 0
          ? "None"
          : `${country.borderCount} ${country.borderCount === 1 ? "country" : "countries"}`,
    },
    { label: "Language(s)", value: country.languages.join(", ") || "Unknown" },
    { label: "Currency", value: country.currencies.join(", ") || "Unknown" },
    { label: "Religion", value: country.religion ?? "No clear majority" },
    { label: "Government", value: country.governmentType ?? "Not recorded" },
    {
      label: "HDI",
      value: country.hdiEstimated ? `${country.hdi.toFixed(3)} (estimated — no official figure)` : country.hdi.toFixed(3),
    },
  ];
}

export function CountryReveal({ country }: { country: Country }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", fontFamily: FONT_FAMILY }}>
      <FlagImage
        flagUrl={country.flagUrl}
        alt={`Flag of ${country.name}`}
        maxWidth={240}
        maxHeight={144}
        borderColor={COLORS.border}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
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
        {/* Labels in their own column so the values line up as a table; the
            column sizes to the longest label rather than a guessed width. */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 14px", fontSize: 13 }}>
          {factsFor(country).map((fact) => (
            <Fragment key={fact.label}>
              <span style={{ color: COLORS.textDimmed, whiteSpace: "nowrap" }}>{fact.label}</span>
              <span style={{ fontWeight: 600 }}>{fact.value}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
