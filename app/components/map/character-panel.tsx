import type { LucideIcon } from "lucide-react";
import { Heart, Shield, Sparkles, Sword } from "lucide-react";

import { playHoverSound } from "../../lib/audio";
import type { Move, PlayerStats, StatKey } from "./types";
import { getAbilityIconLabel, getAbilityIconSrc } from "./utils";

const statCards: {
  key: StatKey;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "health", label: "Health", Icon: Heart },
  { key: "attack", label: "Attack", Icon: Sword },
  { key: "defense", label: "Defense", Icon: Shield },
  { key: "magic", label: "Magic", Icon: Sparkles },
];

type CharacterPanelProps = {
  playerStats: PlayerStats | null;
  playerMoves: Move[];
  onClose: () => void;
  onSpendXp: (stat: StatKey) => void;
  onSwapMove: (move: Move) => void;
};

type StatCardProps = {
  stat: {
    key: StatKey;
    label: string;
    Icon: LucideIcon;
  };
  playerStats: PlayerStats;
  onSpendXp: (stat: StatKey) => void;
};

function StatCard({
  stat,
  playerStats,
  onSpendXp,
}: StatCardProps) {
  const { key, label, Icon } = stat;

  return (
    <div className="stats-card">
      <div className="stats-icon-wrap">
        <Icon aria-hidden="true" className="stats-icon" strokeWidth={2.2} />
      </div>
      <p className="stats-label">{label}</p>
      <p className="stats-value">{playerStats[key]}</p>
      <button
        className="stats-buy"
        type="button"
        onClick={() => onSpendXp(key)}
        onFocus={playHoverSound}
        onMouseEnter={playHoverSound}
        disabled={playerStats.xp <= 0}
      >
        +1
      </button>
    </div>
  );
}

type AbilityCardProps = {
  move: Move;
  onSwapMove: (move: Move) => void;
};

function AbilityCard({ move, onSwapMove }: AbilityCardProps) {
  const iconSrc = getAbilityIconSrc(move);

  return (
    <div className="ability-slot">
      <div className="ability-slot-icon">
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
      <p className="ability-slot-name">{move.name}</p>
      <button
        className="stats-buy ability-slot-action"
        type="button"
        onClick={() => onSwapMove(move)}
        onFocus={playHoverSound}
        onMouseEnter={playHoverSound}
      >
        Swap
      </button>
    </div>
  );
}

export function CharacterPanel({
  playerStats,
  playerMoves,
  onClose,
  onSpendXp,
  onSwapMove,
}: CharacterPanelProps) {
  return (
    <section className="stats-panel" aria-label="Character menu">
      <div className="stats-header">
        <div>
          <p className="stats-kicker">Character</p>
          <h2 className="stats-title">Spend XP</h2>
        </div>
        <button
          className="stats-close"
          type="button"
          onClick={onClose}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Close
        </button>
      </div>

      <p className="stats-xp">XP Available: {playerStats ? playerStats.xp : "--"}</p>

      {playerStats ? (
        <div className="stats-grid">
          {statCards.map((stat) => (
            <StatCard
              key={stat.key}
              stat={stat}
              playerStats={playerStats}
              onSpendXp={onSpendXp}
            />
          ))}
        </div>
      ) : null}

      <div className="abilities-section">
        <p className="abilities-title">Abilities</p>
        {playerMoves.length > 0 ? (
          <div className="abilities-grid">
            {playerMoves.map((move) => (
              <AbilityCard key={move.id} move={move} onSwapMove={onSwapMove} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
