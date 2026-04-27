import { useEffect, useRef, useState } from "react";

import type { DirectionKey } from "../../../lib/fight/qte-rules";

type KeySequenceQteProps = {
  onComplete: (score: number) => void;
  sequence: string[] | DirectionKey[];
  timeLimitMs: number;
};

const arrowGlyphs: Record<DirectionKey, string> = {
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
};

function getKeyLabel(key: string) {
  return key in arrowGlyphs
    ? arrowGlyphs[key as DirectionKey]
    : key;
}

export function KeySequenceQte({
  onComplete,
  sequence,
  timeLimitMs,
}: KeySequenceQteProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(timeLimitMs);
  const completeRef = useRef(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const startedAt = Date.now();

    const timerId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextTimeLeftMs = Math.max(0, timeLimitMs - elapsedMs);

      setTimeLeftMs(nextTimeLeftMs);

      if (nextTimeLeftMs <= 0 && !completeRef.current) {
        completeRef.current = true;
        onComplete(currentIndexRef.current / sequence.length);
      }
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      const expectedKey = sequence[currentIndexRef.current];

      if (!expectedKey || completeRef.current) {
        return;
      }

      const pressedKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
      const normalizedExpected = expectedKey.length === 1 ? expectedKey.toUpperCase() : expectedKey;

      if (pressedKey !== normalizedExpected) {
        return;
      }

      const nextIndex = currentIndexRef.current + 1;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);

      if (nextIndex >= sequence.length) {
        completeRef.current = true;
        window.clearInterval(timerId);
        onComplete(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearInterval(timerId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete, sequence, timeLimitMs]);

  return (
    <div className="fight-qte-panel">
      <p className="fight-qte-stat">Time: {(timeLeftMs / 1000).toFixed(1)}s</p>
      <div className="fight-qte-sequence">
        {sequence.map((key, index) => (
          <span
            key={`${key}-${index}`}
            className={`fight-qte-sequence-key ${index < currentIndex ? "fight-qte-sequence-key-complete" : ""} ${index === currentIndex ? "fight-qte-sequence-key-active" : ""}`}
          >
            {getKeyLabel(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
