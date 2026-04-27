import type { MoveQteType, QteDefinition } from "../../components/map/types";

export type DirectionKey = "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft";

export type BattleQteSession =
  | {
      definition: QteDefinition;
      id: string;
      moveId: string;
      moveName: string;
      prompt: string;
      qte: "mash_spacebar";
      durationMs: number;
      targetCount: number;
    }
  | {
      definition: QteDefinition;
      id: string;
      moveId: string;
      moveName: string;
      prompt: string;
      qte: "click_bubbles";
      lifetimeMs: number;
      maxVisible: number;
      targetCount: number;
    }
  | {
      definition: QteDefinition;
      id: string;
      moveId: string;
      moveName: string;
      prompt: string;
      qte: "keyboard_buttons";
      sequence: string[];
      timeLimitMs: number;
    }
  | {
      definition: QteDefinition;
      id: string;
      moveId: string;
      moveName: string;
      prompt: string;
      qte: "arrow_sequence";
      sequence: DirectionKey[];
      timeLimitMs: number;
    }
  | {
      definition: QteDefinition;
      id: string;
      moveId: string;
      moveName: string;
      prompt: string;
      qte: "hold_release";
      targetMs: number;
      toleranceMs: number;
    };

const keyboardPool = "ASDFGHJKLQWERTYUIOPZXCVBNM1234567890".split("");
const directions: DirectionKey[] = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];

function randomFromList<T>(items: T[], rng: () => number) {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function takeRandomSequence<T>(items: T[], count: number, rng: () => number) {
  return Array.from({ length: count }, () => randomFromList(items, rng));
}

function clampLevel(level: number) {
  return Math.max(1, Math.min(level, 5));
}

function asNumber(value: QteDefinition["qteValue"]) {
  return typeof value === "number" ? value : 0;
}

function createSessionId(moveId: string, qte: MoveQteType) {
  return `${moveId}-${qte}-${globalThis.crypto.randomUUID()}`;
}

// Difficulty scales mostly by raising counts and shortening time windows as battle
// level rises, while preserving the base backend QTE meaning.
export function createBattleQteSession(
  definition: QteDefinition,
  move: { id: string; name: string },
  level: number,
  rng = Math.random,
): BattleQteSession {
  const scaledLevel = clampLevel(level);
  const prompt = `Channel the surge into ${move.name}.`;

  switch (definition.qte) {
    case "mash_spacebar": {
      const baseSeconds = asNumber(definition.qteValue) || 5;

      return {
        definition,
        id: createSessionId(move.id, definition.qte),
        moveId: move.id,
        moveName: move.name,
        prompt,
        qte: definition.qte,
        durationMs: baseSeconds * 1000,
        targetCount: 14 + scaledLevel * 5,
      };
    }

    case "click_bubbles": {
      const targetCount = asNumber(definition.qteValue) + (scaledLevel - 1);

      return {
        definition,
        id: createSessionId(move.id, definition.qte),
        moveId: move.id,
        moveName: move.name,
        prompt,
        qte: definition.qte,
        lifetimeMs: Math.max(700, 1500 - scaledLevel * 120),
        maxVisible: Math.min(5, 2 + scaledLevel),
        targetCount,
      };
    }

    case "keyboard_buttons":
      return {
        definition,
        id: createSessionId(move.id, definition.qte),
        moveId: move.id,
        moveName: move.name,
        prompt,
        qte: definition.qte,
        sequence: takeRandomSequence(keyboardPool, asNumber(definition.qteValue), rng),
        timeLimitMs: Math.max(2400, 6200 - scaledLevel * 500),
      };

    case "arrow_sequence":
      return {
        definition,
        id: createSessionId(move.id, definition.qte),
        moveId: move.id,
        moveName: move.name,
        prompt,
        qte: definition.qte,
        sequence: takeRandomSequence(directions, asNumber(definition.qteValue), rng),
        timeLimitMs: Math.max(2200, 5600 - scaledLevel * 450),
      };

    case "hold_release":
      return {
        definition,
        id: createSessionId(move.id, definition.qte),
        moveId: move.id,
        moveName: move.name,
        prompt,
        qte: definition.qte,
        targetMs: asNumber(definition.qteValue) * 1000,
        toleranceMs: Math.max(220, 900 - scaledLevel * 120),
      };
  }
}

export function pickBattleQte(
  qtes: QteDefinition[],
  move: { id: string; name: string },
  level: number,
  rng = Math.random,
) {
  if (qtes.length === 0) {
    return null;
  }

  const selectedQte = randomFromList(qtes, rng);

  if (!selectedQte) {
    return null;
  }

  return createBattleQteSession(selectedQte, move, level, rng);
}
