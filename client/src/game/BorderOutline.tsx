import { Text } from "@mantine/core";
import { useEffect, useState } from "react";

const OUTLINE_BOX_SIZE = 150;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 700;

// mapsicon's silhouettes are black shapes on a transparent background, keyed
// by lowercase cca2 — the same convention country-flags uses for flag SVGs.
function borderOutlineUrl(cca2: string): string {
  return `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${cca2.toLowerCase()}/1024.png`;
}

export function BorderOutline({ cca2 }: { cca2: string }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // A fresh country (new game) should get a clean slate rather than
  // inheriting a previous country's failure/retry state.
  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [cca2]);

  const handleError = () => {
    if (attempt < MAX_RETRIES) {
      window.setTimeout(() => setAttempt((a) => a + 1), RETRY_DELAY_MS);
    } else {
      setFailed(true);
    }
  };

  return (
    <div
      style={{
        width: OUTLINE_BOX_SIZE,
        height: OUTLINE_BOX_SIZE,
        borderRadius: 8,
        border: "1px solid var(--mantine-color-default-border)",
        // A fixed light background regardless of colour scheme — the
        // silhouette is a dark shape and would vanish against a dark theme.
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {failed ? (
        <Text size="xs" c="dark.4" ta="center" px="xs">
          Outline unavailable
        </Text>
      ) : (
        // Keyed by attempt so a retry re-mounts the img and re-triggers the
        // network request rather than reusing the failed one.
        <img
          key={attempt}
          src={borderOutlineUrl(cca2)}
          alt="Country border outline"
          onError={handleError}
          style={{
            maxWidth: OUTLINE_BOX_SIZE - 20,
            maxHeight: OUTLINE_BOX_SIZE - 20,
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}
