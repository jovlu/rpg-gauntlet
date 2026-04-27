import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { CharacterPanel } from "../components/map/character-panel";
import { EnemyGrid } from "../components/map/enemy-grid";
import { MapToolbar } from "../components/map/map-toolbar";
import { SwapPanel } from "../components/map/swap-panel";
import type {
  Enemy,
  Move,
  MovesResponse,
  Player,
  PlayerMovesResponse,
  PlayerResponse,
  PlayerStats,
  StatKey,
  UnlockedMovesResponse,
} from "../components/map/types";
import { getEnemyId } from "../components/map/utils";
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
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<OverlayState>({ type: "none" });
  const [message, setMessage] = useState<string | null>(null);
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerMoves, setPlayerMoves] = useState<Move[]>([]);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);
  const [unlockedMoves, setUnlockedMoves] = useState<Move[]>([]);

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
    const [playerResponse, movesResponse, unlockedMovesResponse] = await Promise.all([
      fetch(apiUrl("/player")),
      fetch(apiUrl("/moves")),
      fetch(apiUrl("/moves/unlocked")),
    ]);
    const playerData = (await playerResponse.json()) as PlayerResponse;
    const movesData = (await movesResponse.json()) as MovesResponse;
    const unlockedData = unlockedMovesResponse.ok
      ? ((await unlockedMovesResponse.json()) as UnlockedMovesResponse)
      : { unlockedMoves: playerData.player.moves };
    const moveLookup = new globalThis.Map(
      movesData.moves.map((move) => [move.id, move]),
    );
    const nextMoves = playerData.player.moves
      .map((moveId) => moveLookup.get(moveId))
      .filter((move): move is Move => Boolean(move));
    const nextUnlockedMoves = unlockedData.unlockedMoves
      .map((moveId) => moveLookup.get(moveId))
      .filter((move): move is Move => Boolean(move));

    setAllMoves(movesData.moves);
    setPlayer(playerData.player);
    setPlayerLevel(playerData.player.level);
    setPlayerStats(playerData.player.stats);
    setPlayerMoves(nextMoves);
    setUnlockedMoves(nextUnlockedMoves);
  };

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  const handleFullscreen = async () => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }

      setMessage(null);
    } catch {
      setMessage("Fullscreen was blocked. Try again after interacting with the page.");
    }
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

  const handleReplaceMove = async (equippedMoveId: string, unlockedMoveId: string) => {
    if (!player) {
      return;
    }

    const nextMoveIds = player.moves.map((moveId) =>
      moveId === equippedMoveId ? unlockedMoveId : moveId,
    );

    let savedMoves: string[] | null = null;

    try {
      const response = await fetch(apiUrl("/player/moves"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moves: nextMoveIds,
        }),
      });

      if (!response.ok) {
        setSwapMessage("Could not save equipped abilities.");
        return;
      }

      const data = (await response.json()) as PlayerMovesResponse;
      savedMoves = data.moves;
    } catch {
      setSwapMessage("Could not save equipped abilities.");
      return;
    }

    const moveLookup = new globalThis.Map(allMoves.map((move) => [move.id, move]));
    const nextEquippedMoves = (savedMoves ?? nextMoveIds)
      .map((moveId) => moveLookup.get(moveId))
      .filter((move): move is Move => Boolean(move));

    setPlayer({
      ...player,
      moves: savedMoves ?? nextMoveIds,
    });
    setPlayerMoves(nextEquippedMoves);
    setSwapMessage(`${moveLookup.get(unlockedMoveId)?.name ?? "Ability"} equipped.`);
    setOverlay({ type: "character" });
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

      <EnemyGrid
        enemies={enemies}
        onSelectEnemy={(enemy) => navigate(`/fight/${getEnemyId(enemy)}`)}
        playerLevel={playerLevel}
      />

      {overlay.type === "menu" ? (
        <div className="map-overlay">
          <MenuPanel
            fullscreenLabel="Toggle fullscreen"
            onFullscreen={() => {
              void handleFullscreen();
            }}
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
              equippedMoves={playerMoves}
              move={overlay.move}
              onBack={() => setOverlay({ type: "character" })}
              onReplaceMove={(replacementMoveId) =>
                void handleReplaceMove(overlay.move.id, replacementMoveId)
              }
              unlockedMoves={unlockedMoves}
              message={swapMessage}
            />
          ) : (
            <CharacterPanel
              message={swapMessage}
              playerStats={playerStats}
              playerMoves={playerMoves}
              onClose={() => setOverlay({ type: "none" })}
              onSpendXp={(stat) => void handleSpendXp(stat)}
              onSwapMove={(move) => {
                setSwapMessage(null);
                setOverlay({ type: "swap", move });
              }}
            />
          )}
        </div>
      ) : null}
    </main>
  );
}
