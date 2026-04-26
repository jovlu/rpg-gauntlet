import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { BattleStage } from "../components/fight/battle-stage";
import { FightStatePanel } from "../components/fight/fight-state-panel";
import { MoveCommandPanel } from "../components/fight/move-command-panel";
import { useBattleController } from "../lib/fight/use-battle-controller";
import type { BattleSeed } from "../lib/fight/types";
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
  enemyMoves: Move[];
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
  const victoryRewardAppliedRef = useRef(false);
  const [fightState, setFightState] = useState<FightState>({
    enemy: null,
    player: null,
    enemyMoves: [],
    playerMoves: [],
  });

  useEffect(() => {
    enableAmbientAudio();
    victoryRewardAppliedRef.current = false;
    void loadFight();
  }, [params.enemyid]);

  const loadFight = async () => {
    // The fight screen needs the roster entry, the player snapshot, and the shared move catalog
    // so it can resolve move ids into full move definitions.
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
    // Enemy levels are currently inferred from map order until the backend provides them directly.
    const enemies = enemiesData.enemies.map((enemy, index) => ({
      ...enemy,
      level: index + 1,
    }));
    const enemy =
      enemies.find((entry) => getEnemyId(entry) === params.enemyid) ?? null;

    setFightState({
      player: playerData.player,
      enemyMoves: enemy
        ? enemy.moves
            .map((moveId) => moveLookup.get(moveId))
            .filter((move): move is Move => Boolean(move))
        : [],
      playerMoves: playerData.player.moves
        .map((moveId) => moveLookup.get(moveId))
        .filter((move): move is Move => Boolean(move)),
      enemy,
    });
  };

  const player = fightState.player;
  const enemy = fightState.enemy;
  const blocked = Boolean(player && enemy && enemy.level > player.level);
  const battleSeed = useMemo<BattleSeed | null>(() => {
    if (!player || !enemy || blocked) {
      return null;
    }

    return {
      player,
      playerMoves: fightState.playerMoves,
      enemy,
      enemyMoves: fightState.enemyMoves,
    };
  }, [blocked, enemy, fightState.enemyMoves, fightState.playerMoves, player]);
  const battle = useBattleController(blocked ? null : battleSeed);

  useEffect(() => {
    const shouldApplyVictoryRewards =
      battle.battleState?.winner === "player" &&
      player &&
      enemy &&
      !victoryRewardAppliedRef.current;

    if (!shouldApplyVictoryRewards) {
      return;
    }

    victoryRewardAppliedRef.current = true;

    const xpReward = enemy.level * (Math.floor(Math.random() * 3) + 1);
    const rewardRequests: Promise<Response>[] = [
      fetch(apiUrl("/player/stats"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          health: player.stats.health,
          attack: player.stats.attack,
          defense: player.stats.defense,
          magic: player.stats.magic,
          xp: player.stats.xp + xpReward,
        }),
      }),
    ];

    if (enemy.level === player.level && player.level < 5) {
      rewardRequests.push(
        fetch(apiUrl("/player/level"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            level: player.level + 1,
          }),
        }),
      );
    }

    void Promise.all(rewardRequests);
  }, [battle.battleState?.winner, enemy, player]);

  // Keep the route responsible for loading/gating state only.
  // Turn-by-turn combat logic should live in the fight engine/controller layer.
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
        {/* Stage renders combatants; command panel owns move selection and battle copy. */}
        {battle.battleState ? (
          <>
            <BattleStage enemy={battle.battleState.enemy} player={battle.battleState.player} />
            <MoveCommandPanel
              canAct={battle.playerCanAct}
              cooldowns={battle.battleState.player.cooldowns}
              detail={battle.detail}
              headline={battle.headline}
              moves={battle.battleState.player.moves}
              onSelectMove={battle.selectPlayerMove}
              phase={battle.phase}
            />
          </>
        ) : (
          <FightStatePanel
            actionLabel="Return To Map"
            copy="Loading battle state..."
            kicker="Preparing"
            onAction={() => navigate("/map")}
            title="Summoning The Arena"
          />
        )}
      </div>
    </main>
  );
}
