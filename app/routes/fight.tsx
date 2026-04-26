import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { BattleStage } from "../components/fight/battle-stage";
import { FightStatePanel } from "../components/fight/fight-state-panel";
import { MoveCommandPanel } from "../components/fight/move-command-panel";
import type { Enemy, Move, MovesResponse, Player, PlayerResponse } from "../components/map/types";
import { getEnemyId } from "../components/map/utils";
import { apiUrl } from "../lib/config";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import type { Route } from "./+types/fight";
import "./fight.css";

type FightEnemy = Enemy & { level: number };

type FightState = {
  enemy: FightEnemy | null;
  player: Player | null;
  playerMoves: Move[];
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Fight" },
    { name: "description", content: "Fight scene for RPG Gauntlet." },
  ];
}

export default function Fight({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [fightState, setFightState] = useState<FightState>({
    enemy: null,
    player: null,
    playerMoves: [],
  });

  useEffect(() => {
    enableAmbientAudio();
    void loadFight();
  }, [params.enemyid]);

  const loadFight = async () => {
    const [playerResponse, enemiesResponse, movesResponse] = await Promise.all([
      fetch(apiUrl("/player")),
      fetch(apiUrl("/enemies")),
      fetch(apiUrl("/moves")),
    ]);

    const playerData = (await playerResponse.json()) as PlayerResponse;
    const enemiesData = (await enemiesResponse.json()) as { enemies: Enemy[] };
    const movesData = (await movesResponse.json()) as MovesResponse;
    const moveLookup = new globalThis.Map(
      movesData.moves.map((move) => [move.id, move]),
    );
    const enemies = enemiesData.enemies.map((enemy, index) => ({
      ...enemy,
      level: index + 1,
    }));
    const enemy =
      enemies.find((entry) => getEnemyId(entry) === params.enemyid) ?? null;

    setFightState({
      player: playerData.player,
      playerMoves: playerData.player.moves
        .map((moveId) => moveLookup.get(moveId))
        .filter((move): move is Move => Boolean(move)),
      enemy,
    });
  };

  const player = fightState.player;
  const enemy = fightState.enemy;
  const blocked = Boolean(player && enemy && enemy.level > player.level);

  if (!player || !enemy) {
    return (
      <main className="home-screen fight-screen fight-screen-state px-5 py-6">
        <FightStatePanel
          actionLabel="Return To Map"
          copy={enemy ? "Loading battle data..." : "That enemy could not be found."}
          kicker="Preparing"
          onAction={() => navigate("/map")}
          title="Summoning The Arena"
        />
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="home-screen fight-screen fight-screen-state px-5 py-6">
        <FightStatePanel
          actionLabel="Return To Map"
          copy={`You are level ${player.level}. Reach level ${enemy.level} to challenge this fight.`}
          kicker="Locked Battle"
          onAction={() => navigate("/map")}
          title={`${enemy.name} Overpowers You`}
        />
      </main>
    );
  }

  return (
    <main className="home-screen fight-screen">
      <div className="fight-toolbar">
        <button
          className="fight-toolbar-button"
          type="button"
          onClick={() => navigate("/map")}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Retreat
        </button>
      </div>

      <div className="fight-layout">
        <BattleStage enemy={enemy} player={player} />
        <MoveCommandPanel enemyName={enemy.name} moves={fightState.playerMoves} />
      </div>
    </main>
  );
}
