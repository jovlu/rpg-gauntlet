import { playHoverSound } from "../../lib/audio";
import type { Move } from "../map/types";
import { getAbilityIconLabel, getAbilityIconSrc } from "../map/utils";
import "./move-button.css";

type MoveButtonProps = {
  cooldown: number;
  disabled: boolean;
  move: Move;
  onSelect: (moveId: string) => void;
  superchargeReady: boolean;
};

export function MoveButton({
  cooldown,
  disabled,
  move,
  onSelect,
  superchargeReady,
}: MoveButtonProps) {
  const iconSrc = getAbilityIconSrc(move);
  const stateLabel = cooldown > 0 ? `Cooldown ${cooldown}` : "Ready";
  const shouldGlow = superchargeReady && cooldown <= 0 && !disabled;

  return (
    <button
      aria-label={`${move.name}: ${move.description}`}
      className={`fight-move-button ${disabled ? "fight-move-button-disabled" : ""} ${shouldGlow ? "fight-move-button-supercharged" : ""}`}
      disabled={disabled}
      type="button"
      onClick={() => onSelect(move.id)}
      onFocus={playHoverSound}
      onMouseEnter={playHoverSound}
    >
      <div className="fight-move-icon">
        {/* Fall back to a text glyph when an icon asset is missing or intentionally blank. */}
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
      <div className="fight-move-meta">
        <p className="fight-move-meta-name">{move.name}</p>
        <p className="fight-move-meta-state">{stateLabel}</p>
      </div>
      {cooldown > 0 ? (
        <div
          aria-hidden="true"
          className="fight-move-cooldown-mask"
          style={{ height: `${cooldown >= 2 ? 100 : 50}%` }}
        />
      ) : null}
      <div className="fight-move-tooltip" role="tooltip">
        <p className="fight-move-name">{move.name}</p>
        <p className="fight-move-description">{move.description}</p>
      </div>
    </button>
  );
}
