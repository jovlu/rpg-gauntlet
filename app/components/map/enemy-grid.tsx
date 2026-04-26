import monstersSheet from "../../assets/32rogues/monsters.png";
import { playHoverSound } from "../../lib/audio";
import type { Enemy } from "./types";
import { SheetSprite } from "../sprites/sheet-sprite";

type EnemyGridProps = {
  enemies: Enemy[];
  onSelectEnemy: (enemy: Enemy) => void;
  playerLevel: number;
};

export function EnemyGrid({
  enemies,
  onSelectEnemy,
  playerLevel,
}: EnemyGridProps) {
  return (
    <section className="map-screen w-full max-w-[1100px]">
      <div className="map-header">
        <p className="map-kicker">World Map</p>
        <h1 className="map-title">Choose A Level</h1>
        <p className="map-copy">Five enemies stand between you and the castle.</p>
      </div>

      <div className="map-grid">
        {enemies.map((enemy, index) => {
          const level = index + 1;
          const locked = level > playerLevel;

          return (
            <button
              key={`${enemy.index}-${enemy.name}`}
              className={`map-node${locked ? " map-node-locked" : ""}`}
              type="button"
              disabled={locked}
              onClick={() => onSelectEnemy(enemy)}
              onFocus={playHoverSound}
              onMouseEnter={playHoverSound}
            >
              <div className="map-node-image">
                <SheetSprite
                  className="map-node-sprite"
                  image={monstersSheet}
                  index={enemy.index}
                  label={enemy.name}
                  scale={3}
                  sheetHeight={416}
                  sheetWidth={384}
                />
              </div>
              <p className="map-node-label">Level {level}</p>
              <p className="map-node-copy">{enemy.name}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
