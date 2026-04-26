import type { CSSProperties } from "react";

type SheetSpriteProps = {
  className?: string;
  image: string;
  index: string;
  label: string;
  scale?: number;
  sheetHeight: number;
  sheetWidth: number;
  spriteSize?: number;
  style?: CSSProperties;
};

export function SheetSprite({
  className = "",
  image,
  index,
  label,
  scale = 1,
  sheetHeight,
  sheetWidth,
  spriteSize = 32,
  style,
}: SheetSpriteProps) {
  const [rowLabel, columnLabel] = index.split(".");
  const row = Number(rowLabel) - 1;
  const column = columnLabel.toLowerCase().charCodeAt(0) - 97;
  const scaledSize = spriteSize * scale;

  return (
    <div
      aria-label={label}
      className={className}
      role="img"
      style={{
        width: scaledSize,
        height: scaledSize,
        backgroundImage: `url(${image})`,
        backgroundPosition: `-${column * scaledSize}px -${row * scaledSize}px`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
