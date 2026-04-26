import { playHoverSound } from "../../lib/audio";
import type { Move } from "./types";
import { getAbilityIconLabel } from "./utils";

type SwapPanelProps = {
  move: Move;
  onBack: () => void;
};

export function SwapPanel({ move, onBack }: SwapPanelProps) {
  return (
    <section className="stats-panel swap-panel" aria-label="Swap ability">
      <div className="stats-header">
        <div>
          <p className="stats-kicker">Abilities</p>
          <h2 className="stats-title">Swap Ability</h2>
        </div>
        <button
          className="stats-close"
          type="button"
          onClick={onBack}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Back
        </button>
      </div>

      <div className="swap-panel-card">
        <div className="ability-slot-icon swap-panel-icon">
          {getAbilityIconLabel(move)}
        </div>
        <div className="swap-panel-copy">
          <p className="swap-panel-name">{move.name}</p>
          <p className="swap-panel-description">{move.description}</p>
        </div>
      </div>

      <div className="swap-panel-box">
        <p className="swap-panel-label">Replacement Ability</p>
        <p className="swap-panel-text">
          Swap flow placeholder. This overlay is ready for the next step where
          you choose a replacement ability.
        </p>
      </div>
    </section>
  );
}
