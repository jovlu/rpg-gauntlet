import type { Move } from "../map/types";
import { MoveButton } from "./move-button";
import "./move-command-panel.css";

type MoveCommandPanelProps = {
  canAct: boolean;
  cooldowns: Record<string, number>;
  moves: Move[];
  onSelectMove: (moveId: string) => void;
};

export function MoveCommandPanel({
  canAct,
  cooldowns,
  moves,
  onSelectMove,
}: MoveCommandPanelProps) {
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
          />
        ))}
      </div>
    </section>
  );
}
