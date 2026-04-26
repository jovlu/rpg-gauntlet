import type { Move } from "../map/types";
import { MoveButton } from "./move-button";
import "./move-command-panel.css";

type MoveCommandPanelProps = {
  enemyName: string;
  moves: Move[];
};

export function MoveCommandPanel({
  enemyName,
  moves,
}: MoveCommandPanelProps) {
  return (
    <section className="fight-command-panel" aria-label="Battle commands">
      <div className="fight-command-copy">
        <p className="fight-command-kicker">Encounter</p>
        <h2 className="fight-command-title">{enemyName} Appeared</h2>
      </div>
      <div className="fight-move-grid">
        {moves.map((move) => (
          <MoveButton key={move.id} move={move} />
        ))}
      </div>
    </section>
  );
}
