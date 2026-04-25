import { useEffect, useState } from "react";
import { Heart, Shield, Sparkles, Sword } from "lucide-react";

import monstersSheet from "../assets/32rogues/monsters.png";
import type { Route } from "./+types/map";
import { MenuPanel } from "../components/menu-panel";
import { apiUrl } from "../lib/config";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import "./home.css";
import "./map.css";

type StatKey = "health" | "attack" | "defense" | "magic";
type PlayerStats = Record<StatKey, number> & { xp: number };
type PlayerResponse = {
  player: {
    name: string;
    index: string;
    moves: string[];
    stats: PlayerStats;
  };
};
type Enemy = {
  name: string;
  index: string;
};

const abilitySlots = [
  "Ability Slot 1",
  "Ability Slot 2",
  "Ability Slot 3",
  "Ability Slot 4",
] as const;

const statCards: {
  key: StatKey;
  label: string;
  Icon: typeof Heart;
}[] = [
  { key: "health", label: "Health", Icon: Heart },
  { key: "attack", label: "Attack", Icon: Sword },
  { key: "defense", label: "Defense", Icon: Shield },
  { key: "magic", label: "Magic", Icon: Sparkles },
];

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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Map" },
    { name: "description", content: "Map screen for RPG Gauntlet." },
  ];
}

export default function Map() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [enemiesLoading, setEnemiesLoading] = useState(true);
  const [enemiesError, setEnemiesError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    enableAmbientAudio();
    void loadEnemies();
    void loadPlayerStats();
  }, []);

  const loadEnemies = async () => {
    setEnemiesLoading(true);
    setEnemiesError(null);

    try {
      const response = await fetch(apiUrl("/enemies"));
      const data = (await response.json()) as
        | { enemies: Enemy[] }
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Couldn't load enemies.");
      }

      setEnemies(data.enemies);
    } catch (error) {
      setEnemiesError(
        error instanceof Error ? error.message : "Couldn't load enemies.",
      );
    } finally {
      setEnemiesLoading(false);
    }
  };

  const loadPlayerStats = async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const response = await fetch(apiUrl("/player"));
      const data = (await response.json()) as
        | PlayerResponse
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Couldn't load player stats.");
      }

      setPlayerStats(data.player.stats);
    } catch (error) {
      setStatsError(
        error instanceof Error ? error.message : "Couldn't load player stats.",
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  const handleSpendXp = async (stat: StatKey) => {
    if (!playerStats || playerStats.xp <= 0 || statsSaving) {
      return;
    }

    const nextStats = {
      health: playerStats.health,
      attack: playerStats.attack,
      defense: playerStats.defense,
      magic: playerStats.magic,
      [stat]: playerStats[stat] + 1,
    };

    setStatsSaving(true);
    setStatsError(null);

    try {
      const response = await fetch(apiUrl("/player/stats"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextStats),
      });
      const data = (await response.json()) as
        | { stats: PlayerStats }
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Couldn't update player stats.");
      }

      setPlayerStats(data.stats);
    } catch (error) {
      setStatsError(
        error instanceof Error ? error.message : "Couldn't update player stats.",
      );
    } finally {
      setStatsSaving(false);
    }
  };

  return (
    <main className="home-screen map-layout px-5 py-6">
      <div className="map-toolbar">
        <button
          className="map-toolbar-button"
          type="button"
          onClick={() => {
            setStatsOpen((open) => !open);
            setMenuOpen(false);
          }}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Abilities
        </button>
        <button
          className="map-toolbar-button"
          type="button"
          onClick={() => {
            setMenuOpen((open) => !open);
            setStatsOpen(false);
          }}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Menu
        </button>
      </div>

      <section className="map-screen w-full max-w-[1100px]">
        <div className="map-header">
          <p className="map-kicker">World Map</p>
          <h1 className="map-title">Choose A Level</h1>
          <p className="map-copy">
            Five enemies stand between you and the castle.
          </p>
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
              onClick={() => void loadEnemies()}
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

      {menuOpen ? (
        <div className="map-overlay">
          <MenuPanel
            primaryLabel="Resume"
            onPrimary={() => {
              setMenuOpen(false);
              setMessage(null);
            }}
            onExit={handleExitGame}
            message={message}
          />
        </div>
      ) : null}

      {statsOpen ? (
        <div className="map-overlay">
          <section className="stats-panel" aria-label="Character menu">
            <div className="stats-header">
              <div>
                <p className="stats-kicker">Character</p>
                <h2 className="stats-title">Spend XP</h2>
              </div>
              <button
                className="stats-close"
                type="button"
                onClick={() => setStatsOpen(false)}
                onFocus={playHoverSound}
                onMouseEnter={playHoverSound}
              >
                Close
              </button>
            </div>

            <p className="stats-xp">
              XP Available: {playerStats ? playerStats.xp : "--"}
            </p>

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
                {statCards.map(({ key, label, Icon }) => (
                  <div key={key} className="stats-card">
                    <div className="stats-icon-wrap">
                      <Icon
                        aria-hidden="true"
                        className="stats-icon"
                        strokeWidth={2.2}
                      />
                    </div>
                    <p className="stats-label">{label}</p>
                    <p className="stats-value">{playerStats[key]}</p>
                    <button
                      className="stats-buy"
                      type="button"
                      onClick={() => void handleSpendXp(key)}
                      onFocus={playHoverSound}
                      onMouseEnter={playHoverSound}
                      disabled={playerStats.xp <= 0 || statsSaving}
                    >
                      {statsSaving ? "..." : "+1"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                className="stats-close"
                type="button"
                onClick={() => void loadPlayerStats()}
                onFocus={playHoverSound}
                onMouseEnter={playHoverSound}
              >
                Retry
              </button>
            )}

            <div className="abilities-section">
              <p className="abilities-title">Abilities</p>
              <div className="abilities-grid">
                {abilitySlots.map((slot) => (
                  <div key={slot} className="ability-slot">
                    <div className="ability-slot-icon">?</div>
                    <p className="ability-slot-name">{slot}</p>
                    <p className="ability-slot-copy">Server placeholder</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
