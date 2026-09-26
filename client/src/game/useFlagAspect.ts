import { useEffect, useState } from "react";
import { knownFlagAspect, loadFlagAspect } from "./flagSampler";

// The flag's width over its height, or undefined until its image has
// loaded. Nothing that crops the flag can be placed before this is known.
export function useFlagAspect(flagUrl: string): number | undefined {
  const [loaded, setLoaded] = useState<{ url: string; aspect: number }>();
  const known = knownFlagAspect(flagUrl);

  useEffect(() => {
    if (known !== undefined) return;
    let live = true;
    loadFlagAspect(flagUrl)
      .then((aspect) => {
        if (live) setLoaded({ url: flagUrl, aspect });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [flagUrl, known]);

  return known ?? (loaded?.url === flagUrl ? loaded.aspect : undefined);
}
