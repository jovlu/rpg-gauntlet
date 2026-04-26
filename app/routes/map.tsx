import { useEffect, useState } from "react";

import { CharacterPanel } from "../components/map/character-panel";
import { EnemyGrid } from "../components/map/enemy-grid";
import { MapToolbar } from "../components/map/map-toolbar";
import { SwapPanel } from "../components/map/swap-panel";
import type {
  Enemy,
  Move,
  MovesResponse,
  PlayerResponse,
  PlayerStats,
  StatKey,
} from "../components/map/types";
import type { Route } from "./+types/map";
import { MenuPanel } from "../components/menu-panel";
import { apiUrl } from "../lib/config";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import "./home.css";
import "./map.css";

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
  const [playerMoves, setPlayerMoves] = useState<Move[]>([]);
  const [abilitiesLoading, setAbilitiesLoading] = useState(true);
  const [abilitiesError, setAbilitiesError] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

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
      void loadPlayerMoves(data.player.moves);
    } catch (error) {
      setStatsError(
        error instanceof Error ? error.message : "Couldn't load player stats.",
      );
      setPlayerMoves([]);
      setAbilitiesError("Couldn't load abilities.");
      setAbilitiesLoading(false);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPlayerMoves = async (moveIds: string[]) => {
    setAbilitiesLoading(true);
    setAbilitiesError(null);

    try {
      const response = await fetch(apiUrl("/moves"));
      const data = (await response.json()) as MovesResponse | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Couldn't load abilities.");
      }

      const moveLookup = new globalThis.Map(
        data.moves.map((move) => [move.id, move]),
      );
      const nextMoves = moveIds
        .map((moveId) => moveLookup.get(moveId))
        .filter((move): move is Move => Boolean(move));

      setPlayerMoves(nextMoves);
    } catch (error) {
      setPlayerMoves([]);
      setAbilitiesError(
        error instanceof Error ? error.message : "Couldn't load abilities.",
      );
    } finally {
      setAbilitiesLoading(false);
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
      <MapToolbar
        onToggleAbilities={() => {
          setSelectedMove(null);
          setStatsOpen((open) => !open);
          setMenuOpen(false);
        }}
        onToggleMenu={() => {
          setMenuOpen((open) => !open);
          setStatsOpen(false);
        }}
      />

      <EnemyGrid
        enemies={enemies}
        enemiesLoading={enemiesLoading}
        enemiesError={enemiesError}
        onRetry={() => void loadEnemies()}
      />

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
          {selectedMove ? (
            <SwapPanel move={selectedMove} onBack={() => setSelectedMove(null)} />
          ) : (
            <CharacterPanel
              playerStats={playerStats}
              statsLoading={statsLoading}
              statsSaving={statsSaving}
              statsError={statsError}
              playerMoves={playerMoves}
              abilitiesLoading={abilitiesLoading}
              abilitiesError={abilitiesError}
              onClose={() => {
                setSelectedMove(null);
                setStatsOpen(false);
              }}
              onRetry={() => void loadPlayerStats()}
              onSpendXp={(stat) => void handleSpendXp(stat)}
              onSwapMove={setSelectedMove}
            />
          )}
        </div>
      ) : null}
    </main>
  );
}
