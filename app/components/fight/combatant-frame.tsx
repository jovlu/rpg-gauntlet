import type { CombatStats } from "../map/types";
import type { BattleStatus } from "../../lib/fight/types";
import "./combatant-frame.css";

type CombatantFrameProps = {
  side: "enemy" | "player";
  currentHealth: number;
  level: number;
  maxHealth: number;
  name: string;
  nextSuperchargeAt?: number;
  movesSinceSupercharge?: number;
  stats: CombatStats;
  statuses: BattleStatus[];
  superchargeReady?: boolean;
};

export function CombatantFrame({
  side,
  currentHealth,
  level,
  maxHealth,
  name,
  nextSuperchargeAt,
  movesSinceSupercharge,
  stats,
  statuses,
  superchargeReady = false,
}: CombatantFrameProps) {
  const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;
  const showSupercharge = side === "player" && typeof movesSinceSupercharge === "number" && typeof nextSuperchargeAt === "number";
  const superchargeProgress = showSupercharge
    ? Math.max(0, Math.min(nextSuperchargeAt, movesSinceSupercharge))
    : 0;
  const superchargePercent = showSupercharge && nextSuperchargeAt > 0
    ? (superchargeProgress / nextSuperchargeAt) * 100
    : 0;

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
      {showSupercharge ? (
        <div className="fight-frame-supercharge" aria-live="polite">
          <div className="fight-frame-supercharge-copy">
            <span className="fight-frame-supercharge-label">Supercharge</span>
            <span className={`fight-frame-supercharge-state ${superchargeReady ? "fight-frame-supercharge-state-ready" : ""}`}>
              {superchargeReady
                ? "Ready now"
                : `${superchargeProgress}/${nextSuperchargeAt}`}
            </span>
          </div>
          <div className="fight-frame-supercharge-track" aria-hidden="true">
            <div
              className={`fight-frame-supercharge-fill ${superchargeReady ? "fight-frame-supercharge-fill-ready" : ""}`}
              style={{ width: `${superchargePercent}%` }}
            />
          </div>
        </div>
      ) : null}
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
