import monstersSheet from "../../assets/32rogues/monsters.png";
import { playHoverSound } from "../../lib/audio";
import type { Enemy } from "./types";

const SPRITE_SIZE = 32;
const SPRITE_SCALE = 3;
const SHEET_WIDTH = 384;
const SHEET_HEIGHT = 416;

function getEnemySpriteStyle(index: string) {
  const [rowLabel, columnLabel] = index.split(".");
  const row = Number(rowLabel) - 1;
  const column = columnLabel.toLowerCase().charCodeAt(0) - 97;
  const scaledSize = SPRITE_SIZE * SPRITE_SCALE;

  return {
    backgroundImage: `url(${monstersSheet})`,
    backgroundPosition: `-${column * scaledSize}px -${row * scaledSize}px`,
    backgroundSize: `${SHEET_WIDTH * SPRITE_SCALE}px ${SHEET_HEIGHT * SPRITE_SCALE}px`,
  };
}

type EnemyGridProps = {
  enemies: Enemy[];
  enemiesLoading: boolean;
  enemiesError: string | null;
  onRetry: () => void;
};

export function EnemyGrid({
  enemies,
  enemiesLoading,
  enemiesError,
  onRetry,
}: EnemyGridProps) {
  return (
    <section className="map-screen w-full max-w-[1100px]">
      <div className="map-header">
        <p className="map-kicker">World Map</p>
        <h1 className="map-title">Choose A Level</h1>
        <p className="map-copy">Five enemies stand between you and the castle.</p>
      </div>

      {enemiesLoading ? (
        <p className="map-message" role="status">
          Loading enemies...
        </p>
      ) : enemiesError ? (
        <div className="map-message-wrap">
          <p className="map-message" role="status">
            {enemiesError}
          </p>
          <button
            className="map-toolbar-button"
            type="button"
            onClick={onRetry}
            onFocus={playHoverSound}
            onMouseEnter={playHoverSound}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="map-grid">
          {enemies.map((enemy, index) => (
            <button
              key={`${enemy.index}-${enemy.name}`}
              className="map-node"
              type="button"
              onFocus={playHoverSound}
              onMouseEnter={playHoverSound}
            >
              <div className="map-node-image">
                <div
                  aria-label={enemy.name}
                  className="map-node-sprite"
                  role="img"
                  style={getEnemySpriteStyle(enemy.index)}
                />
              </div>
              <p className="map-node-label">Level {index + 1}</p>
              <p className="map-node-copy">{enemy.name}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
