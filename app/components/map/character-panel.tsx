import type { LucideIcon } from "lucide-react";
import { Heart, Shield, Sparkles, Sword } from "lucide-react";

import { playHoverSound } from "../../lib/audio";
import type { Move, PlayerStats, StatKey } from "./types";
import { getAbilityIconLabel } from "./utils";

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
  statsLoading: boolean;
  statsSaving: boolean;
  statsError: string | null;
  playerMoves: Move[];
  abilitiesLoading: boolean;
  abilitiesError: string | null;
  onClose: () => void;
  onRetry: () => void;
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
  statsSaving: boolean;
  onSpendXp: (stat: StatKey) => void;
};

function StatCard({
  stat,
  playerStats,
  statsSaving,
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
        disabled={playerStats.xp <= 0 || statsSaving}
      >
        {statsSaving ? "..." : "+1"}
      </button>
    </div>
  );
}

type AbilityCardProps = {
  move: Move;
  onSwapMove: (move: Move) => void;
};

function AbilityCard({ move, onSwapMove }: AbilityCardProps) {
  return (
    <div className="ability-slot">
      <div className="ability-slot-icon">{getAbilityIconLabel(move)}</div>
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
  statsLoading,
  statsSaving,
  statsError,
  playerMoves,
  abilitiesLoading,
  abilitiesError,
  onClose,
  onRetry,
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

      {statsError ? (
        <p className="stats-message" role="status">
          {statsError}
        </p>
      ) : null}

      {statsLoading ? (
        <p className="stats-message" role="status">
          Loading player stats...
        </p>
      ) : playerStats ? (
        <div className="stats-grid">
          {statCards.map((stat) => (
            <StatCard
              key={stat.key}
              stat={stat}
              playerStats={playerStats}
              statsSaving={statsSaving}
              onSpendXp={onSpendXp}
            />
          ))}
        </div>
      ) : (
        <button
          className="stats-close"
          type="button"
          onClick={onRetry}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Retry
        </button>
      )}

      <div className="abilities-section">
        <p className="abilities-title">Abilities</p>
        {abilitiesLoading ? (
          <p className="stats-message" role="status">
            Loading abilities...
          </p>
        ) : abilitiesError ? (
          <div className="map-message-wrap">
            <p className="stats-message" role="status">
              {abilitiesError}
            </p>
            <button
              className="stats-close"
              type="button"
              onClick={onRetry}
              onFocus={playHoverSound}
              onMouseEnter={playHoverSound}
            >
              Retry
            </button>
          </div>
        ) : playerMoves.length > 0 ? (
          <div className="abilities-grid">
            {playerMoves.map((move) => (
              <AbilityCard key={move.id} move={move} onSwapMove={onSwapMove} />
            ))}
          </div>
        ) : (
          <p className="stats-message" role="status">
            No abilities available.
          </p>
        )}
      </div>
    </section>
  );
}
