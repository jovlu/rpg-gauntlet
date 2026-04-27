import { useEffect, useRef, useState } from "react";

type HoldReleaseQteProps = {
  onComplete: (score: number) => void;
  targetMs: number;
  toleranceMs: number;
};

export function HoldReleaseQte({
  onComplete,
  targetMs,
  toleranceMs,
}: HoldReleaseQteProps) {
  const [holding, setHolding] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const countdownMs = Math.max(0, targetMs - elapsedMs);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!holding || holdStartRef.current === null) {
        return;
      }

      setElapsedMs(Date.now() - holdStartRef.current);
    }, 25);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [holding]);

  const handleDown = () => {
    if (holding) {
      return;
    }

    holdStartRef.current = Date.now();
    setElapsedMs(0);
    setHolding(true);
  };

  const handleUp = () => {
    if (!holding || holdStartRef.current === null) {
      return;
    }

    const heldMs = Date.now() - holdStartRef.current;
    const distance = Math.abs(targetMs - heldMs);
    const score = Math.max(0, 1 - distance / toleranceMs);

    holdStartRef.current = null;
    setHolding(false);
    setElapsedMs(heldMs);
    onComplete(score);
  };

  return (
    <div className="fight-qte-panel">
      <p className="fight-qte-stat">Target: {(targetMs / 1000).toFixed(1)}s</p>
      <p className="fight-qte-stat">Tolerance: ±{Math.round(toleranceMs / 1000)}s</p>
      <button
        className={`fight-qte-action ${holding ? "fight-qte-action-holding" : ""}`}
        type="button"
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
      >
        {holding ? `${(countdownMs / 1000).toFixed(2)}s` : "Hold and release"}
      </button>
    </div>
  );
}
