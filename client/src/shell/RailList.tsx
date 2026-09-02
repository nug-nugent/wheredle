import { useEffect, useRef, useState, type ReactNode } from "react";
import { COLORS, FONT_FAMILY } from "../theme";

// The rail's layout, shared by both modes: the same list of cards laid out
// as a vertical rail on desktop, a horizontal scrolling strip on a phone,
// and a wrapping grid when that strip is pinned open. Only the cards differ
// between modes — what a rail *is* does not.
export function RailList({
  layout,
  empty,
  children,
}: {
  layout: "column" | "row" | "grid";
  /** `long` for the rail and the pinned strip; `short` for the one-line strip. */
  empty: { short: string; long: string };
  children: ReactNode[];
}) {
  if (children.length === 0) {
    // Both the rail and the pinned-open strip have room for the full dashed
    // placeholder; only the one-line strip has to make do with a bare line.
    return layout === "row" ? (
      <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: FONT_FAMILY }}>{empty.short}</div>
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
        {empty.long}
      </div>
    );
  }

  if (layout === "column") {
    return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>;
  }

  // Pinned open, the strip's cards keep their compact shape but wrap instead
  // of running off the edge: several rows read at a glance, which is the
  // whole point of giving the panel the extra height.
  if (layout === "grid") {
    return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>{children}</div>;
  }

  return <RailStrip>{children}</RailStrip>;
}

// The strip runs off both edges of a phone with more cards than fit, and a
// row cropped mid-card doesn't say "swipe me" loudly enough on its own. Each
// end that has more behind it gets a fade and a chevron — tappable, so the
// hint doubles as the control — and both disappear at the ends of the
// travel, which is what makes them read as a position rather than decoration.
function RailStrip({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      // A sub-pixel slack: fractional widths otherwise leave a chevron
      // showing at an end the strip has actually reached.
      setMore({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // Watches the row as well as the viewport, since a new card changes what
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
      {/* Cards keep the height their own content needs rather than
          stretching to the tallest. A wrapping label makes one card several
          lines deep — Alex's language exclusions run to four on a phone —
          and stretched neighbours turn that into a band of half-empty
          blocks. Tops aligned, heights ragged, reads as a list of facts of
          different lengths, which is what it is. */}
      <div ref={scrollerRef} style={{ display: "flex", alignItems: "flex-start", gap: 8, overflowX: "auto" }}>
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
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
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
