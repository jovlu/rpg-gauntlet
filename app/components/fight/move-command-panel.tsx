import type { Move } from "../map/types";
import { MoveButton } from "./move-button";
import "./move-command-panel.css";

type MoveCommandPanelProps = {
  canAct: boolean;
  cooldowns: Record<string, number>;
  detail: string | null;
  headline: string;
  moves: Move[];
  onSelectMove: (moveId: string) => void;
  phase: "idle" | "player-turn" | "announcing" | "finished";
};

export function MoveCommandPanel({
  canAct,
  cooldowns,
  detail,
  headline,
  moves,
  onSelectMove,
  phase,
}: MoveCommandPanelProps) {
  const kicker =
    phase === "finished"
      ? "Battle Ended"
      : phase === "announcing"
        ? "Action"
        : phase === "player-turn"
          ? "Your Turn"
          : "Preparing";

  return (
    <section className="fight-command-panel" aria-label="Battle commands">
      <div className="fight-command-copy">
        <p className="fight-command-kicker">{kicker}</p>
        <h2 className="fight-command-title">{headline}</h2>
        <p className="fight-command-detail">
          {detail ?? "Every move goes on cooldown for 2 of that fighter's turns."}
        </p>
      </div>
      <div className="fight-move-grid">
        {moves.map((move) => (
          <MoveButton
            key={move.id}
            cooldown={cooldowns[move.id] ?? 0}
            disabled={!canAct || (cooldowns[move.id] ?? 0) > 0}
            move={move}
            onSelect={onSelectMove}
          />
        ))}
      </div>
    </section>
  );
}
