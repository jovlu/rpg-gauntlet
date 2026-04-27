import { MOVE_SUPERCHARGE_TURNS } from "../../lib/fight/engine";
import type { Move } from "../map/types";
import { MoveButton } from "./move-button";
import "./move-command-panel.css";

type MoveCommandPanelProps = {
  canAct: boolean;
  cooldowns: Record<string, number>;
  moves: Move[];
  onSelectMove: (moveId: string) => void;
  superchargeProgress: number;
  superchargeReady: boolean;
};

export function MoveCommandPanel({
  canAct,
  cooldowns,
  moves,
  onSelectMove,
  superchargeProgress,
  superchargeReady,
}: MoveCommandPanelProps) {
  const clampedProgress = Math.min(MOVE_SUPERCHARGE_TURNS, superchargeProgress);

  return (
    <section className="fight-command-panel" aria-label="Battle commands">
      <div className="fight-move-grid">
        {moves.map((move) => (
          <MoveButton
            key={move.id}
            cooldown={cooldowns[move.id] ?? 0}
            disabled={!canAct || (cooldowns[move.id] ?? 0) > 0}
            move={move}
            onSelect={onSelectMove}
            superchargeReady={superchargeReady}
          />
        ))}
      </div>
      <div className="fight-supercharge-panel" aria-live="polite">
        <div className="fight-supercharge-copy">
          <p className="fight-supercharge-title">Supercharge</p>
          <p className={`fight-supercharge-state ${superchargeReady ? "fight-supercharge-state-ready" : ""}`}>
            {superchargeReady
              ? "Ready now. Your next move will trigger a QTE."
              : `${clampedProgress}/${MOVE_SUPERCHARGE_TURNS} moves charged`}
          </p>
        </div>
        <div className="fight-supercharge-meter" aria-hidden="true">
          <div
            className={`fight-supercharge-meter-fill ${superchargeReady ? "fight-supercharge-meter-fill-ready" : ""}`}
            style={{ width: `${(clampedProgress / MOVE_SUPERCHARGE_TURNS) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
