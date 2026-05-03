import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { BattleStage } from "../components/fight/battle-stage";
import { FightStatePanel } from "../components/fight/fight-state-panel";
import { MoveCommandPanel } from "../components/fight/move-command-panel";
import { FightQteOverlay } from "../components/fight/qte/fight-qte-overlay";
import { useBattleController } from "../lib/fight/use-battle-controller";
import { loadQtes } from "../lib/fight/load-qtes";
import type { BattleSeed } from "../lib/fight/types";
import type {
  Enemy,
  Move,
  MovesResponse,
  Player,
  PlayerResponse,
  QteDefinition,
  UnlockedMovesResponse,
} from "../components/map/types";
import { getEnemyId } from "../components/map/utils";
import { apiUrl } from "../lib/config";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import type { Route } from "./+types/fight";
import "./home.css";
import "./fight.css";

type FightEnemy = Enemy & { level: number };

type FightState = {
  enemy: FightEnemy | null;
  player: Player | null;
  enemyMoves: Move[];
  playerMoves: Move[];
  qtes: QteDefinition[];
};

type PostBattleState =
  | { type: "none" }
  | { type: "defeat" }
  | {
      type: "victory";
      learnedMoveName: string | null;
      continueTo: "/map" | "/congrats";
    };

const XP_REWARD_BY_LEVEL: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 4,
};
const POST_BATTLE_PRESENTATION_MS = 2600;

function waitForPostBattlePresentation() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, POST_BATTLE_PRESENTATION_MS);
  });
}

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
    qtes: [],
  });
  const [fightLoaded, setFightLoaded] = useState(false);
  const [postBattleState, setPostBattleState] = useState<PostBattleState>({ type: "none" });

  useEffect(() => {
    enableAmbientAudio();
    victoryRewardAppliedRef.current = false;
    setFightLoaded(false);
    setPostBattleState({ type: "none" });

    void loadFight();
  }, [params.enemyid]);

  const loadFight = async () => {
    // The fight screen needs the roster entry, the player snapshot, and the shared move catalog
    // so it can resolve move ids into full move definitions.
    const [playerResponse, enemiesResponse, movesResponse, qtes] = await Promise.all([
      fetch(apiUrl("/player")),
      fetch(apiUrl("/enemies")),
      fetch(apiUrl("/moves")),
      loadQtes(),
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
      qtes,
      enemy,
    });
    setFightLoaded(true);
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
  const battle = useBattleController(blocked ? null : battleSeed, fightState.qtes);

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

    let cancelled = false;

    void (async () => {
      const minimumPresentation = waitForPostBattlePresentation();
      const xpReward = XP_REWARD_BY_LEVEL[enemy.level] ?? enemy.level;
      let rewardedMoveName: string | null = null;
      const rewardRequests: Promise<Response>[] = [
        fetch(apiUrl("/player/givexp"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: xpReward,
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

      try {
        const unlockedResponse = await fetch(apiUrl("/moves/unlocked"));

        if (unlockedResponse.ok) {
          const unlockedData = (await unlockedResponse.json()) as UnlockedMovesResponse;
          const lockedEnemyMoves = enemy.moves.filter(
            (moveId) => !unlockedData.unlockedMoves.includes(moveId),
          );

          if (lockedEnemyMoves.length > 0) {
            const rewardedMoveId =
              lockedEnemyMoves[Math.floor(Math.random() * lockedEnemyMoves.length)];

            if (rewardedMoveId) {
              rewardedMoveName =
                fightState.enemyMoves.find((move) => move.id === rewardedMoveId)?.name ?? null;
              rewardRequests.push(
                fetch(apiUrl("/moves/unlocked"), {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    moveId: rewardedMoveId,
                  }),
                }),
              );
            }
          }
        }
      } catch {
        // Keep other victory rewards working even if the unlock route is unavailable.
      }

      try {
        await Promise.all(rewardRequests);
      } catch {
        // Keep the post-battle flow moving even if one reward write fails.
      }

      await minimumPresentation;

      if (cancelled) {
        return;
      }

      setPostBattleState({
        type: "victory",
        learnedMoveName: rewardedMoveName,
        continueTo: enemy.level >= 5 ? "/congrats" : "/map",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [battle.battleState?.winner, enemy, fightState.enemyMoves, player]);

  useEffect(() => {
    if (!battle.battleState?.winner || battle.battleState.winner === "player") {
      return;
    }

    if (typeof window === "undefined") {
      setPostBattleState({ type: "defeat" });
      return;
    }

    const timerId = window.setTimeout(() => {
      setPostBattleState({ type: "defeat" });
    }, POST_BATTLE_PRESENTATION_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [battle.battleState?.winner]);

  // Keep the route responsible for loading/gating state only.
  // Turn-by-turn combat logic should live in the fight engine/controller layer.
  if (!player || !enemy) {
    return (
      <main className="home-screen fight-screen fight-screen-state px-5 py-6">
        <FightStatePanel
          actionLabel="Return To Map"
          copy={fightLoaded ? "That enemy could not be found." : "Loading battle data..."}
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

  if (postBattleState.type !== "none") {
    const isVictory = postBattleState.type === "victory";
    const actionDestination = isVictory ? postBattleState.continueTo : "/map";
    const resultCopy = isVictory
      ? postBattleState.learnedMoveName
        ? `You learned ${postBattleState.learnedMoveName}. It is now available in move management for future battles.`
        : postBattleState.continueTo === "/congrats"
          ? "The final opponent falls. The gauntlet is complete."
          : "You already know every move this monster can teach."
      : "Nothing is lost. Return to the map and challenge this fight again when you are ready.";

    return (
      <main className="home-screen fight-screen">
        <div className="fight-layout">
          {battle.battleState ? (
            <div className="fight-stage-stack fight-stage-stack-finished">
              <BattleStage
                enemy={battle.battleState.enemy}
                messageDetail={battle.detail}
                messageHeadline={battle.headline}
                player={battle.battleState.player}
                showMessage={false}
                stageMessageId={battle.stageMessageId}
              />
              <section
                className={`fight-stage-reward fight-stage-outcome fight-stage-outcome-${postBattleState.type}`}
                aria-label="Battle result"
              >
                <p className="fight-stage-reward-kicker">
                  {isVictory ? "Victory" : "Defeat"}
                </p>
                <h1 className="fight-stage-reward-title">
                  {isVictory ? `${enemy.name} Defeated` : `${enemy.name} Prevails`}
                </h1>
                <p className="fight-stage-reward-copy">{resultCopy}</p>
                <button
                  className="fight-toolbar-button"
                  type="button"
                  onClick={() => navigate(actionDestination)}
                  onFocus={playHoverSound}
                  onMouseEnter={playHoverSound}
                >
                  {isVictory ? "Continue" : "Return To Map"}
                </button>
              </section>
            </div>
          ) : null}
          <div className="fight-command-panel fight-command-panel-disabled" aria-hidden="true" />
        </div>
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
            <div className="fight-stage-stack">
              <BattleStage
                enemy={battle.battleState.enemy}
                messageDetail={battle.detail}
                messageHeadline={battle.headline}
                player={battle.battleState.player}
                showMessage={battle.showStageMessage}
                stageMessageId={battle.stageMessageId}
              />
              <FightQteOverlay
                onComplete={battle.completeQte}
                session={battle.activeQte}
              />
            </div>
            <MoveCommandPanel
              canAct={battle.playerCanAct}
              cooldowns={battle.battleState.player.cooldowns}
              moves={battle.battleState.player.moves}
              onSelectMove={battle.selectPlayerMove}
              superchargeReady={battle.battleState.player.superchargeReady}
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
