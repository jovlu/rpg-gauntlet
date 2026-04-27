import { useEffect, useRef, useState } from "react";

type Bubble = {
  createdAt: number;
  hue: number;
  id: string;
  size: number;
  swayMs: number;
  x: number;
  y: number;
};

type BubblePopQteProps = {
  lifetimeMs: number;
  maxVisible: number;
  onComplete: (score: number) => void;
  targetCount: number;
};

function createBubble() {
  return {
    createdAt: Date.now(),
    hue: Math.round(185 + Math.random() * 120),
    id: globalThis.crypto.randomUUID(),
    size: 42 + Math.random() * 28,
    swayMs: 1800 + Math.random() * 1600,
    x: 10 + Math.random() * 74,
    y: 10 + Math.random() * 66,
  };
}

export function BubblePopQte({
  lifetimeMs,
  maxVisible,
  onComplete,
  targetCount,
}: BubblePopQteProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const completeRef = useRef(false);
  const poppedRef = useRef(0);

  useEffect(() => {
    const endAt = Date.now() + Math.max(3200, targetCount * 650);

    const intervalId = window.setInterval(() => {
      if (completeRef.current) {
        return;
      }

      const now = Date.now();

      setBubbles((current) => {
        const activeBubbles = current.filter((bubble) => now - bubble.createdAt < lifetimeMs);

        if (activeBubbles.length >= maxVisible) {
          return activeBubbles;
        }

        return [...activeBubbles, createBubble()];
      });

      if (now >= endAt) {
        completeRef.current = true;
        onComplete(Math.min(1, poppedRef.current / targetCount));
      }
    }, Math.max(220, lifetimeMs / 3));

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lifetimeMs, maxVisible, onComplete, targetCount]);

  const handlePop = (bubbleId: string) => {
    if (completeRef.current) {
      return;
    }

    poppedRef.current += 1;
    setPoppedCount(poppedRef.current);
    setBubbles((current) => current.filter((bubble) => bubble.id !== bubbleId));

    if (poppedRef.current >= targetCount) {
      completeRef.current = true;
      onComplete(1);
    }
  };

  return (
    <div className="fight-qte-panel">
      <p className="fight-qte-stat">Popped: {poppedCount} / {targetCount}</p>
      <div className="fight-qte-bubble-field">
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            className="fight-qte-bubble"
            style={{
              ["--fight-qte-bubble-hue" as string]: bubble.hue.toString(),
              ["--fight-qte-bubble-sway-ms" as string]: `${bubble.swayMs}ms`,
              height: `${bubble.size}px`,
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
            }}
            type="button"
            onClick={() => handlePop(bubble.id)}
          />
        ))}
      </div>
    </div>
  );
}
