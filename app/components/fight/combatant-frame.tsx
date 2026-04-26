import type { CombatStats } from "../map/types";
import type { BattleStatus } from "../../lib/fight/types";
import "./combatant-frame.css";

type CombatantFrameProps = {
  side: "enemy" | "player";
  currentHealth: number;
  level: number;
  maxHealth: number;
  name: string;
  stats: CombatStats;
  statuses: BattleStatus[];
};

export function CombatantFrame({
  side,
  currentHealth,
  level,
  maxHealth,
  name,
  stats,
  statuses,
}: CombatantFrameProps) {
  const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;

  return (
    <div className={`fight-frame fight-frame-${side}`}>
      <div className="fight-frame-topline">
        <p className="fight-frame-name">{name}</p>
        <p className="fight-frame-level">Lv. {level}</p>
      </div>
      <div className="fight-hp-track">
        <div
          className="fight-hp-fill"
          style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
        />
      </div>
      <p className="fight-frame-health">
        HP {currentHealth} / {maxHealth}
      </p>
      <div className="fight-frame-stats">
        <span>ATK {stats.attack}</span>
        <span>DEF {stats.defense}</span>
        <span>MAG {stats.magic}</span>
      </div>
      {statuses.length > 0 ? (
        <div className="fight-frame-statuses">
          {statuses.map((status) => (
            <span key={status.id} className="fight-status-pill">
              {status.stat.toUpperCase()} {status.amount >= 0 ? "+" : ""}
              {status.amount} [{status.remainingTurns}]
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
