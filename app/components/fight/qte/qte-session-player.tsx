import { useEffect, useRef, useState } from "react";

import type { BattleQteSession } from "../../../lib/fight/qte-rules";
import { FightQteContent } from "./fight-qte-content";
import { QteShell } from "./qte-shell";

const QTE_EXIT_MS = 220;

type QteSessionPlayerProps = {
  mode?: "inline" | "overlay";
  onResolved: (score: number) => void;
  session: BattleQteSession;
  title?: string;
};

type QtePresentationPhase = "ready" | "active" | "exiting";

function formatSeconds(milliseconds: number) {
  return (milliseconds / 1000).toFixed(1);
}

function getReadyBrief(session: BattleQteSession) {
  switch (session.qte) {
    case "mash_spacebar":
      return `A rush is building behind this strike. Hammer Space for ${formatSeconds(session.durationMs)} seconds and drive the blow toward full force.`;

    case "click_bubbles":
      return `Loose sparks are breaking off the spell. Burst ${session.targetCount} of them before they slip away to keep the surge under control.`;

    case "keyboard_buttons":
      return `The pattern is unstable. Thread ${session.sequence.length} keys in the right order before the rhythm collapses.`;

    case "arrow_sequence":
      return `The current is twisting. Match ${session.sequence.length} arrow beats in sequence before the window closes.`;

    case "hold_release":
      return `Hold the pressure, then let go at the perfect moment. Releasing near ${formatSeconds(session.targetMs)} seconds gives the cleanest burst.`;
  }
}

// Every QTE should enter through the same small briefing step instead of hard-cutting
// straight into the minigame. This wrapper also delays teardown long enough to animate out.
export function QteSessionPlayer({
  mode = "overlay",
  onResolved,
  session,
  title,
}: QteSessionPlayerProps) {
  const [phase, setPhase] = useState<QtePresentationPhase>("ready");
  const [visible, setVisible] = useState(false);
  const resolveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("ready");
    setVisible(false);

    const frameId = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);

      if (resolveTimeoutRef.current !== null) {
        window.clearTimeout(resolveTimeoutRef.current);
        resolveTimeoutRef.current = null;
      }
    };
  }, [session.id]);

  useEffect(() => {
    if (phase !== "ready") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "Enter") {
        return;
      }

      event.preventDefault();
      setPhase("active");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase]);

  const beginQte = () => {
    if (phase !== "ready") {
      return;
    }

    setPhase("active");
  };

  const resolveQte = (score: number) => {
    if (phase === "exiting") {
      return;
    }

    setPhase("exiting");
    setVisible(false);

    resolveTimeoutRef.current = window.setTimeout(() => {
      resolveTimeoutRef.current = null;
      onResolved(score);
    }, QTE_EXIT_MS);
  };

  const shellClassName = [
    "fight-qte-shell-animated",
    visible ? "fight-qte-shell-visible" : "fight-qte-shell-hidden",
    phase === "ready" ? "fight-qte-shell-ready" : "",
    phase === "exiting" ? "fight-qte-shell-exiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClassName = [
    mode === "overlay" ? "fight-qte-overlay" : "fight-qte-inline-stage",
    visible ? "fight-qte-overlay-visible" : "fight-qte-overlay-hidden",
  ].join(" ");

  return (
    <div className={wrapperClassName}>
      <QteShell
        className={shellClassName}
        description={session.definition.description}
        prompt={phase === "ready" ? "The move is surging." : session.prompt}
        title={title ?? session.definition.name}
      >
        {phase === "ready" ? (
          <div className="fight-qte-ready-panel">
            <p className="fight-qte-ready-copy">{getReadyBrief(session)}</p>
            <p className="fight-qte-ready-copy">
              A weak run lands at 0.5x. A perfect run spikes the move to 2.5x.
            </p>
            <button
              className="fight-qte-action fight-qte-ready-button"
              type="button"
              onClick={beginQte}
            >
              Begin
            </button>
            <p className="fight-qte-ready-hint">Press Enter or Space to start.</p>
          </div>
        ) : (
          <FightQteContent onComplete={resolveQte} session={session} />
        )}
      </QteShell>
    </div>
  );
}
