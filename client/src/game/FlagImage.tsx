import { useEffect, useState } from "react";

// Mantine's reset makes everything border-box, so a width set on the image
// would be spent on the border first and the flag would get two pixels less
// than it was given. The SVGs keep their own aspect ratio whatever box they
// land in, so they'd letterbox themselves inside that slightly-wrong box —
// a pixel of blank down each side. content-box, against a budget already
// less the border, gives the flag exactly the size worked out for it.
const BORDER_WIDTH = 1;

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
  // What's left for the flag once the border has had its two pixels of each
  // dimension, so the bordered whole still fits the caller's box.
  const innerWidth = maxWidth - BORDER_WIDTH * 2;
  const innerHeight = maxHeight - BORDER_WIDTH * 2;
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });

  useEffect(() => {
    setSize({ width: innerWidth, height: innerHeight });
  }, [flagUrl, innerWidth, innerHeight]);

  return (
    <img
      src={flagUrl}
      alt={alt}
      onLoad={(e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const scale = Math.min(innerWidth / naturalWidth, innerHeight / naturalHeight);
        setSize({ width: naturalWidth * scale, height: naturalHeight * scale });
      }}
      style={{
        width: size.width,
        height: size.height,
        display: "block",
        boxSizing: "content-box",
        border: `${BORDER_WIDTH}px solid ${borderColor}`,
      }}
    />
  );
}
