import { playHoverSound } from "../../lib/audio";

type MapToolbarProps = {
  onToggleAbilities: () => void;
  onToggleMenu: () => void;
};

export function MapToolbar({
  onToggleAbilities,
  onToggleMenu,
}: MapToolbarProps) {
  return (
    <div className="map-toolbar">
      <button
        className="map-toolbar-button"
        type="button"
        onClick={onToggleAbilities}
        onFocus={playHoverSound}
        onMouseEnter={playHoverSound}
      >
        Abilities
      </button>
      <button
        className="map-toolbar-button"
        type="button"
        onClick={onToggleMenu}
        onFocus={playHoverSound}
        onMouseEnter={playHoverSound}
      >
        Menu
      </button>
    </div>
  );
}
