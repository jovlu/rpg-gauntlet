import { useEffect, useRef, useState } from "react";

import type { QteDefinition } from "../../components/map/types";
import {
  canUseMove,
  chooseRandomMove,
  createBattleState,
  getAvailableMoves,
  resolveBattleAction,
} from "./engine";
import { pickBattleQte, type BattleQteSession } from "./qte-rules";
import type { BattleSeed, BattleState } from "./types";

const MESSAGE_PRESENTATION_MS = 2600;

export type BattlePhase = "idle" | "player-turn" | "qte" | "presenting" | "finished";

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

  const summary = parts.length > 0 ? parts.join(" • ") : "No effect.";

  if (state?.winner) {
    return `${summary} • ${getWinnerMessage(state)}`;
  }

  return summary;
}

export function useBattleController(seed: BattleSeed | null, qtes: QteDefinition[]) {
  const [activeQte, setActiveQte] = useState<BattleQteSession | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [phase, setPhase] = useState<BattlePhase>("idle");
  const [headline, setHeadline] = useState("Summoning the arena...");
  const [detail, setDetail] = useState<string | null>(null);
  const [stageMessageId, setStageMessageId] = useState(0);
  const battleStateRef = useRef<BattleState | null>(null);
  const phaseTimeoutRef = useRef<number | null>(null);

  const clearPhaseTimer = () => {
    if (phaseTimeoutRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  };

  const queuePhaseChange = (callback: () => void) => {
    if (typeof window === "undefined") {
      callback();
      return;
    }

    clearPhaseTimer();
    phaseTimeoutRef.current = window.setTimeout(() => {
      phaseTimeoutRef.current = null;
      callback();
    }, MESSAGE_PRESENTATION_MS);
  };

  const commitState = (nextState: BattleState) => {
    battleStateRef.current = nextState;
    setBattleState(nextState);
  };

  const presentMessage = (nextHeadline: string, nextDetail: string | null) => {
    setHeadline(nextHeadline);
    setDetail(nextDetail);
    setStageMessageId((current) => current + 1);
  };

  useEffect(() => {
    clearPhaseTimer();
    setActiveQte(null);

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
      clearPhaseTimer();
    };
  }, [seed]);

  const beginPlayerTurn = (nextState: BattleState) => {
    commitState(nextState);
    setPhase("player-turn");
  };

  const resolveEnemyTurn = (stateAfterPlayerTurn: BattleState) => {
    if (stateAfterPlayerTurn.winner) {
      setPhase("finished");
      return;
    }

    const enemyMove = chooseRandomMove(stateAfterPlayerTurn.enemy);

    if (!enemyMove) {
      presentMessage(
        `${stateAfterPlayerTurn.enemy.name} cannot act.`,
        "All enemy moves are on cooldown.",
      );
      queuePhaseChange(() => {
        beginPlayerTurn(stateAfterPlayerTurn);
      });
      return;
    }

    const nextState = resolveBattleAction(stateAfterPlayerTurn, enemyMove.id);
    commitState(nextState);
    presentMessage(
      `${stateAfterPlayerTurn.enemy.name} uses ${enemyMove.name}.`,
      formatActionDetail(nextState),
    );

    if (nextState.winner) {
      setPhase("finished");
      return;
    }

    queuePhaseChange(() => {
      beginPlayerTurn(nextState);
    });
  };

  const resolvePlayerMove = (
    currentState: BattleState,
    moveId: string,
    moveName: string,
    qteMultiplier: number,
  ) => {
    const nextState = resolveBattleAction(currentState, moveId, qteMultiplier);
    commitState(nextState);
    presentMessage(
      `${currentState.player.name} uses ${moveName}.`,
      `${Math.round(qteMultiplier * 100)}% timing • ${formatActionDetail(nextState)}`,
    );

    if (nextState.winner) {
      setPhase("finished");
      return;
    }

    setPhase("presenting");
    queuePhaseChange(() => {
      resolveEnemyTurn(nextState);
    });
  };

  const selectPlayerMove = (moveId: string) => {
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

    const qteSession = pickBattleQte(
      qtes,
      move,
      Math.max(currentState.player.level, currentState.enemy.level),
    );

    if (!qteSession) {
      resolvePlayerMove(currentState, move.id, move.name, 1);
      return;
    }

    setActiveQte(qteSession);
    setPhase("qte");
  };

  const completeQte = (score: number) => {
    const currentState = battleStateRef.current;

    if (!activeQte || !currentState || phase !== "qte") {
      return;
    }

    const qteMultiplier = Math.max(0, Math.min(1, score));

    setActiveQte(null);
    resolvePlayerMove(currentState, activeQte.moveId, activeQte.moveName, qteMultiplier);
  };

  const playerAvailableMoves = battleState ? getAvailableMoves(battleState.player) : [];

  return {
    activeQte,
    battleState,
    completeQte,
    detail,
    headline,
    phase,
    playerCanAct:
      phase === "player-turn" &&
      battleState?.turn === "player" &&
      !battleState.winner &&
      playerAvailableMoves.length > 0,
    selectPlayerMove,
    showStageMessage: phase === "presenting" || phase === "finished",
    stageMessageId,
  };
}
