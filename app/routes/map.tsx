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
import { enableAmbientAudio } from "../lib/audio";
import "./home.css";
import "./map.css";

type OverlayState =
  | { type: "none" }
  | { type: "menu" }
  | { type: "character" }
  | { type: "swap"; move: Move };

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Map" },
    { name: "description", content: "Map screen for RPG Gauntlet." },
  ];
}

export default function Map() {
  const [overlay, setOverlay] = useState<OverlayState>({ type: "none" });
  const [message, setMessage] = useState<string | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerMoves, setPlayerMoves] = useState<Move[]>([]);

  useEffect(() => {
    enableAmbientAudio();
    void loadEnemies();
    void loadPlayerData();
  }, []);

  const loadEnemies = async () => {
    const response = await fetch(apiUrl("/enemies"));
    const data = (await response.json()) as { enemies: Enemy[] };
    setEnemies(data.enemies);
  };

  const loadPlayerData = async () => {
    const playerResponse = await fetch(apiUrl("/player"));
    const playerData = (await playerResponse.json()) as PlayerResponse;
    const movesResponse = await fetch(apiUrl("/moves"));
    const movesData = (await movesResponse.json()) as MovesResponse;
    const moveLookup = new globalThis.Map(
      movesData.moves.map((move) => [move.id, move]),
    );
    const nextMoves = playerData.player.moves
      .map((moveId) => moveLookup.get(moveId))
      .filter((move): move is Move => Boolean(move));

    setPlayerLevel(playerData.player.level);
    setPlayerStats(playerData.player.stats);
    setPlayerMoves(nextMoves);
  };

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  const handleSpendXp = async (stat: StatKey) => {
    if (!playerStats || playerStats.xp <= 0) {
      return;
    }

    const nextStats = {
      health: playerStats.health,
      attack: playerStats.attack,
      defense: playerStats.defense,
      magic: playerStats.magic,
      [stat]: playerStats[stat] + 1,
    };

    const response = await fetch(apiUrl("/player/stats"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextStats),
    });
    const data = (await response.json()) as { stats: PlayerStats };

    setPlayerStats(data.stats);
  };

  return (
    <main className="home-screen map-layout px-5 py-6">
      <MapToolbar
        onToggleAbilities={() => {
          setOverlay((current) =>
            current.type === "character" ? { type: "none" } : { type: "character" },
          );
        }}
        onToggleMenu={() => {
          setOverlay((current) =>
            current.type === "menu" ? { type: "none" } : { type: "menu" },
          );
        }}
      />

      <EnemyGrid enemies={enemies} playerLevel={playerLevel} />

      {overlay.type === "menu" ? (
        <div className="map-overlay">
          <MenuPanel
            primaryLabel="Resume"
            onPrimary={() => {
              setOverlay({ type: "none" });
              setMessage(null);
            }}
            onExit={handleExitGame}
            message={message}
          />
        </div>
      ) : null}

      {overlay.type === "character" || overlay.type === "swap" ? (
        <div className="map-overlay">
          {overlay.type === "swap" ? (
            <SwapPanel
              move={overlay.move}
              onBack={() => setOverlay({ type: "character" })}
            />
          ) : (
            <CharacterPanel
              playerStats={playerStats}
              playerMoves={playerMoves}
              onClose={() => setOverlay({ type: "none" })}
              onSpendXp={(stat) => void handleSpendXp(stat)}
              onSwapMove={(move) => setOverlay({ type: "swap", move })}
            />
          )}
        </div>
      ) : null}
    </main>
  );
}
