import { useEffect, useRef, useState } from "react";

import type { EnemyMoveResponse, QteDefinition } from "../../components/map/types";
import {
  canUseMove,
  createBattleState,
  getAvailableMoves,
  isCombatantSuperchargeReady,
  MAX_SUPERCHARGE_MULTIPLIER,
  MIN_SUPERCHARGE_MULTIPLIER,
  resolveBattleAction,
} from "./engine";
import { apiUrl } from "../config";
import { pickBattleQte, type BattleQteSession } from "./qte-rules";
import type { BattleSeed, BattleState } from "./types";

const MESSAGE_PRESENTATION_MS = 2600;

export type BattlePhase = "idle" | "intro" | "player-turn" | "qte" | "presenting" | "finished";

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

  const summary = parts.length > 0 ? parts.join(" | ") : "No effect.";

  if (state?.winner) {
    return `${summary} | ${getWinnerMessage(state)}`;
  }

  return summary;
}

function toSuperchargeMultiplier(score: number) {
  const normalizedScore = Math.max(0, Math.min(1, score));
  return (
    MIN_SUPERCHARGE_MULTIPLIER +
    normalizedScore * (MAX_SUPERCHARGE_MULTIPLIER - MIN_SUPERCHARGE_MULTIPLIER)
  );
}

async function fetchEnemyMoveId(state: BattleState) {
  const response = await fetch(apiUrl("/battle/enemy-move"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      battleState: state,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch enemy move.");
  }

  const data = (await response.json()) as EnemyMoveResponse;
  return data.moveId;
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
    setPhase("intro");
    presentMessage(`${seed.enemy.name} appeared.`, "Ready your move.");
    queuePhaseChange(() => {
      beginPlayerTurn(nextState);
    });

    return () => {
      clearPhaseTimer();
    };
  }, [seed]);

  const beginPlayerTurn = (nextState: BattleState) => {
    commitState(nextState);
    setPhase("player-turn");
  };

  const resolveEnemyTurn = async (stateAfterPlayerTurn: BattleState) => {
    if (stateAfterPlayerTurn.winner) {
      setPhase("finished");
      return;
    }

    let enemyMoveId: string | null = null;

    try {
      enemyMoveId = await fetchEnemyMoveId(stateAfterPlayerTurn);
    } catch {
      presentMessage(
        `${stateAfterPlayerTurn.enemy.name} hesitates.`,
        "The server could not choose an enemy move.",
      );
      queuePhaseChange(() => {
        beginPlayerTurn(stateAfterPlayerTurn);
      });
      return;
    }

    const enemyMove =
      stateAfterPlayerTurn.enemy.moves.find((move) => move.id === enemyMoveId) ?? null;

    if (!enemyMove) {
      presentMessage(
        `${stateAfterPlayerTurn.enemy.name} cannot act.`,
        enemyMoveId ? "The chosen enemy move was invalid." : "All enemy moves are on cooldown.",
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
    appliedMultiplier: number,
    options?: {
      consumeSupercharge?: boolean;
      ignoreCooldown?: boolean;
      wasSupercharged?: boolean;
    },
  ) => {
    const nextState = resolveBattleAction(currentState, moveId, appliedMultiplier, options);
    commitState(nextState);

    const nextDetail =
      options?.wasSupercharged
        ? `${Math.round(appliedMultiplier * 100)}% surge | ${formatActionDetail(nextState)}`
        : options?.ignoreCooldown
          ? `Cooldown broken | ${formatActionDetail(nextState)}`
          : appliedMultiplier === 1
        ? formatActionDetail(nextState)
        : `${Math.round(appliedMultiplier * 100)}% surge | ${formatActionDetail(nextState)}`;

    presentMessage(`${currentState.player.name} uses ${moveName}.`, nextDetail);

    if (nextState.winner) {
      setPhase("finished");
      return;
    }

    setPhase("presenting");
    queuePhaseChange(() => {
      void resolveEnemyTurn(nextState);
    });
  };

  const selectPlayerMove = (moveId: string) => {
    const currentState = battleStateRef.current;

    if (
      !currentState ||
      phase !== "player-turn" ||
      currentState.turn !== "player" ||
      !currentState.player.moves.find((entry) => entry.id === moveId)
    ) {
      return;
    }

    const canBreakCooldown =
      currentState.player.superchargeReady && !canUseMove(currentState.player, moveId);

    if (!canUseMove(currentState.player, moveId) && !canBreakCooldown) {
      return;
    }

    const move = currentState.player.moves.find((entry) => entry.id === moveId);

    if (!move) {
      return;
    }

    if (canBreakCooldown) {
      resolvePlayerMove(currentState, move.id, move.name, 1, {
        consumeSupercharge: true,
        ignoreCooldown: true,
      });
      return;
    }

    const qteSession = isCombatantSuperchargeReady(currentState.player)
      ? pickBattleQte(
          qtes,
          move,
          Math.max(currentState.player.level, currentState.enemy.level),
        )
      : null;

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

    const qteMultiplier = toSuperchargeMultiplier(score);

    setActiveQte(null);
    resolvePlayerMove(currentState, activeQte.moveId, activeQte.moveName, qteMultiplier, {
      consumeSupercharge: true,
      wasSupercharged: true,
    });
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
    showStageMessage: phase === "intro" || phase === "presenting" || phase === "finished",
    stageMessageId,
  };
}
