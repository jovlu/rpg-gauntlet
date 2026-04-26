import { useEffect, useRef, useState } from "react";

import {
  canUseMove,
  chooseRandomMove,
  createBattleState,
  getAvailableMoves,
  resolveBattleAction,
} from "./engine";
import type { BattleSeed, BattleState } from "./types";

const MOVE_ANNOUNCEMENT_MS = 2000;

export type BattlePhase = "idle" | "player-turn" | "announcing" | "finished";

function getWinnerMessage(state: BattleState) {
  if (state.winner === "draw") {
    return "Both fighters fall at the same time.";
  }

  if (state.winner === "player") {
    return `${state.enemy.name} is defeated.`;
  }

  if (state.winner === "enemy") {
    return `${state.player.name} is defeated.`;
  }

  return "";
}

function formatActionDetail(state: BattleState | null) {
  const action = state?.lastAction;

  if (!action) {
    return null;
  }

  const parts: string[] = [];

  if (action.damageDealt > 0) {
    parts.push(`Damage ${action.damageDealt}`);
  }

  if (action.selfDamageDealt > 0) {
    parts.push(`Self-damage ${action.selfDamageDealt}`);
  }

  if (action.healingDone > 0) {
    parts.push(`Self-heal ${action.healingDone}`);
  }

  if (action.otherHealingDone > 0) {
    parts.push(`Target heal ${action.otherHealingDone}`);
  }

  if (action.appliedStatuses.length > 0) {
    parts.push(
      action.appliedStatuses
        .map(
          (status) =>
            `${status.target} ${status.stat} ${status.amount >= 0 ? "+" : ""}${status.amount} (${status.remainingTurns})`,
        )
        .join(" | "),
    );
  }

  return parts.length > 0 ? parts.join(" • ") : "No effect.";
}

export function useBattleController(seed: BattleSeed | null) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [phase, setPhase] = useState<BattlePhase>("idle");
  const [headline, setHeadline] = useState("Summoning the arena...");
  const [detail, setDetail] = useState<string | null>(null);
  const battleStateRef = useRef<BattleState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearPendingTimer = () => {
    if (timeoutRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const commitState = (nextState: BattleState) => {
    battleStateRef.current = nextState;
    setBattleState(nextState);
  };

  const queueStep = (callback: () => void) => {
    if (typeof window === "undefined") {
      callback();
      return;
    }

    clearPendingTimer();
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      callback();
    }, MOVE_ANNOUNCEMENT_MS);
  };

  useEffect(() => {
    clearPendingTimer();

    if (!seed) {
      battleStateRef.current = null;
      setBattleState(null);
      setPhase("idle");
      setHeadline("Summoning the arena...");
      setDetail(null);
      return;
    }

    const nextState = createBattleState(seed);
    commitState(nextState);
    setPhase("player-turn");
    setHeadline(`${seed.enemy.name} appeared.`);
    setDetail("Choose your move.");

    return () => {
      clearPendingTimer();
    };
  }, [seed]);

  const finishBattle = (nextState: BattleState) => {
    commitState(nextState);
    setPhase("finished");
    setHeadline(getWinnerMessage(nextState));
    setDetail(formatActionDetail(nextState));
  };

  const beginPlayerTurn = (nextState: BattleState) => {
    commitState(nextState);
    setPhase("player-turn");
    setHeadline(`${nextState.player.name}, choose your move.`);
    setDetail(formatActionDetail(nextState));
  };

  const resolveEnemyTurn = (stateAfterPlayerTurn: BattleState) => {
    if (stateAfterPlayerTurn.winner) {
      finishBattle(stateAfterPlayerTurn);
      return;
    }

    const enemyMove = chooseRandomMove(stateAfterPlayerTurn.enemy);

    if (!enemyMove) {
      beginPlayerTurn(stateAfterPlayerTurn);
      setHeadline(`${stateAfterPlayerTurn.enemy.name} cannot act.`);
      setDetail("All enemy moves are on cooldown.");
      return;
    }

    setPhase("announcing");
    setHeadline(`${stateAfterPlayerTurn.enemy.name} uses ${enemyMove.name}.`);
    setDetail(enemyMove.description);

    queueStep(() => {
      const currentState = battleStateRef.current;

      if (!currentState) {
        return;
      }

      const nextState = resolveBattleAction(currentState, enemyMove.id);

      if (nextState.winner) {
        finishBattle(nextState);
        return;
      }

      beginPlayerTurn(nextState);
    });
  };

  const selectPlayerMove = (moveId: string, qteMultiplier = 1) => {
    const currentState = battleStateRef.current;

    if (
      !currentState ||
      phase !== "player-turn" ||
      currentState.turn !== "player" ||
      !canUseMove(currentState.player, moveId)
    ) {
      return;
    }

    const move = currentState.player.moves.find((entry) => entry.id === moveId);

    if (!move) {
      return;
    }

    setPhase("announcing");
    setHeadline(`${currentState.player.name} uses ${move.name}.`);
    setDetail(move.description);

    queueStep(() => {
      const latestState = battleStateRef.current;

      if (!latestState) {
        return;
      }

      const nextState = resolveBattleAction(latestState, moveId, qteMultiplier);
      commitState(nextState);
      resolveEnemyTurn(nextState);
    });
  };

  const playerAvailableMoves = battleState ? getAvailableMoves(battleState.player) : [];

  return {
    battleState,
    detail,
    headline,
    phase,
    playerCanAct:
      phase === "player-turn" &&
      battleState?.turn === "player" &&
      !battleState.winner &&
      playerAvailableMoves.length > 0,
    selectPlayerMove,
  };
}
