import type { CombatStats } from "../map/types";
import "./combatant-frame.css";

type CombatantFrameProps = {
  side: "enemy" | "player";
  level: number;
  name: string;
  stats: CombatStats;
};

export function CombatantFrame({
  side,
  level,
  name,
  stats,
}: CombatantFrameProps) {
  return (
    <div className={`fight-frame fight-frame-${side}`}>
      <div className="fight-frame-topline">
        <p className="fight-frame-name">{name}</p>
        <p className="fight-frame-level">Lv. {level}</p>
      </div>
      <div className="fight-hp-track">
        <div
          className="fight-hp-fill"
          style={{ width: `${Math.min(100, stats.health)}%` }}
        />
      </div>
      <div className="fight-frame-stats">
        <span>ATK {stats.attack}</span>
        <span>DEF {stats.defense}</span>
        <span>MAG {stats.magic}</span>
      </div>
    </div>
  );
}
