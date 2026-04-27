import { useEffect, useRef, useState } from "react";

type MashSpaceQteProps = {
  durationMs: number;
  onComplete: (score: number) => void;
  targetCount: number;
};

export function MashSpaceQte({
  durationMs,
  onComplete,
  targetCount,
}: MashSpaceQteProps) {
  const [count, setCount] = useState(0);
  const [flashCount, setFlashCount] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const completeRef = useRef(false);
  const countRef = useRef(0);
  const pressFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextTimeLeftMs = Math.max(0, durationMs - elapsedMs);

      setTimeLeftMs(nextTimeLeftMs);

      if (nextTimeLeftMs <= 0 && !completeRef.current) {
        completeRef.current = true;
        onComplete(Math.min(1, countRef.current / targetCount));
      }
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || completeRef.current) {
        return;
      }

      event.preventDefault();
      countRef.current += 1;
      setCount(countRef.current);
      setFlashCount((current) => current + 1);
      setIsPressed(true);

      if (pressFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(pressFeedbackTimeoutRef.current);
      }

      // Keep the spacebar plate visually "hot" while the player is actively mashing.
      pressFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsPressed(false);
      }, 90);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("keydown", handleKeyDown);

      if (pressFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(pressFeedbackTimeoutRef.current);
      }
    };
  }, [durationMs, onComplete, targetCount]);

  const progress = Math.min(1, count / targetCount);
  const urgency = Math.max(0, Math.min(1, 1 - timeLeftMs / durationMs));

  return (
    <div className="fight-qte-panel">
      <div className="fight-qte-mash-stats">
        <p className="fight-qte-stat">Presses: {count}</p>
        <p className="fight-qte-stat">Target: {targetCount}</p>
        <p className="fight-qte-stat">Time: {(timeLeftMs / 1000).toFixed(1)}s</p>
      </div>
      <div className="fight-qte-mash-meter" aria-hidden="true">
        <div
          className="fight-qte-mash-meter-fill"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="fight-qte-mash-meter-target"
          style={{ left: `${Math.min(100, (targetCount / Math.max(targetCount, targetCount)) * 100)}%` }}
        />
      </div>
      <div
        className={`fight-qte-mash-pad ${isPressed ? "fight-qte-mash-pad-active" : ""}`}
        style={{ ["--fight-qte-urgency" as string]: urgency.toString() }}
      >
        <span key={flashCount} className="fight-qte-mash-burst" aria-hidden="true" />
        <span className="fight-qte-mash-keycap" aria-hidden="true">
          Space
        </span>
        <p className="fight-qte-mash-copy">Mash the key before the timer runs out.</p>
      </div>
    </div>
  );
}
