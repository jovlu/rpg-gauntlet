import { playHoverSound } from "../../lib/audio";
import type { Move } from "../map/types";
import { getAbilityIconLabel, getAbilityIconSrc } from "../map/utils";
import "./move-button.css";

type MoveButtonProps = {
  move: Move;
};

export function MoveButton({ move }: MoveButtonProps) {
  const iconSrc = getAbilityIconSrc(move);

  return (
    <button
      aria-label={`${move.name}: ${move.description}`}
      className="fight-move-button"
      type="button"
      onFocus={playHoverSound}
      onMouseEnter={playHoverSound}
    >
      <div className="fight-move-icon">
        {iconSrc ? (
          <img
            alt={move.iconName || move.name}
            className="ability-slot-icon-image"
            src={iconSrc}
          />
        ) : (
          getAbilityIconLabel(move)
        )}
      </div>
      <div className="fight-move-tooltip" role="tooltip">
        <p className="fight-move-name">{move.name}</p>
        <p className="fight-move-description">{move.description}</p>
      </div>
    </button>
  );
}
