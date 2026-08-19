import { useEffect, useRef, useState } from "react";
import type { KnownFact } from "./categories";
import { FactCard } from "./FactCard";
import { COLORS, FONT_FAMILY } from "../theme";

// The single knowledge rail: everything the guesses have established about
// the target, positives (green) above exclusions (grey). How a fact was
// learnt deliberately isn't encoded — a tertile pinned down by eliminating
// the other two is as certain as one matched outright, and the distinction
// wouldn't change the player's next guess. Renders the same list three ways:
// a vertical rail on desktop, a horizontal scrolling strip on mobile, and a
// wrapping grid when that strip is pinned open to a third of the screen —
// see the usages in AlexApp.
export function KnownFacts({
  facts,
  direction = "column",
}: {
  facts: KnownFact[];
  direction?: "column" | "row" | "grid";
}) {
  if (facts.length === 0) {
    // Both the rail and the pinned-open strip have room for the full dashed
    // placeholder; only the one-line strip has to make do with a bare line.
    return direction === "row" ? (
      <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: FONT_FAMILY }}>Nothing known yet.</div>
    ) : (
      <div
        style={{
          border: `1px dashed ${COLORS.borderDashed}`,
          padding: 16,
          fontSize: 12,
          color: COLORS.textFaint,
          fontFamily: FONT_FAMILY,
        }}
      >
        Nothing known yet — take a guess.
      </div>
    );
  }

  const cards = facts.map((fact) => (
    <FactCard
      key={fact.key}
      header={fact.header}
      label={fact.label}
      layout={direction === "column" ? "column" : "row"}
      tone={fact.kind === "is" ? "correct" : "excluded"}
    />
  ));

  if (direction === "column") {
    return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{cards}</div>;
  }

  // Pinned open, the strip's cards keep their compact shape but wrap instead
  // of running off the edge: several rows of facts read at a glance, which is
  // the whole point of giving the panel the extra height.
  if (direction === "grid") {
    return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>{cards}</div>;
  }

  return <FactStrip>{cards}</FactStrip>;
}

// The strip runs off both edges of a phone with more facts than fit, and a
// row of cards cropped mid-card doesn't say "swipe me" loudly enough on its
// own. Each end that has more behind it gets a fade and a chevron — tappable,
// so the hint doubles as the control — and both disappear at the ends of the
// travel, which is what makes them read as a position rather than decoration.
function FactStrip({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      // A sub-pixel slack: fractional widths otherwise leave a chevron
      // showing at a end the strip has actually reached.
      setMore({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // Watches the row as well as the viewport, since a new fact changes what
    // overflows without changing the scroller's own size.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const nudge = (towards: -1 | 1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: towards * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={scrollerRef} style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {children}
      </div>
      {more.left && <ScrollChevron side="left" onClick={() => nudge(-1)} />}
      {more.right && <ScrollChevron side="right" onClick={() => nudge(1)} />}
    </div>
  );
}

function ScrollChevron({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll facts left" : "Scroll facts right"}
      onClick={onClick}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: side === "left" ? "flex-start" : "flex-end",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: COLORS.text,
        background: `linear-gradient(to ${side}, transparent, ${COLORS.surface} 70%)`,
      }}
    >
      <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
        <path d={side === "left" ? "M7.5 1 1.5 7l6 6" : "M1.5 1l6 6-6 6"} />
      </svg>
    </button>
  );
}
