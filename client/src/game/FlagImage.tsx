import { useEffect, useState } from "react";

// Flags don't share one aspect ratio (Saudi Arabia's is far from the common
// 3:2), so a fixed-size box with objectFit: contain leaves a letterboxed gap
// between the flag and the border. Sizing the image itself to the flag's
// natural aspect ratio keeps the border snug against the flag edges.
export function FlagImage({
  flagUrl,
  alt,
  maxWidth,
  maxHeight,
  borderColor,
}: {
  flagUrl: string;
  alt: string;
  maxWidth: number;
  maxHeight: number;
  borderColor: string;
}) {
  const [size, setSize] = useState({ width: maxWidth, height: maxHeight });

  useEffect(() => {
    setSize({ width: maxWidth, height: maxHeight });
  }, [flagUrl, maxWidth, maxHeight]);

  return (
    <img
      src={flagUrl}
      alt={alt}
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
        setSize({ width: naturalWidth * scale, height: naturalHeight * scale });
      }}
      style={{
        width: size.width,
        height: size.height,
        display: "block",
        border: `1px solid ${borderColor}`,
      }}
    />
  );
}
