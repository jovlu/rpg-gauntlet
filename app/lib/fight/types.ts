import type {
  CombatStats,
  Enemy,
  Move,
  MoveStatusEffect,
  Player,
  StatKey,
} from "../../components/map/types";

export type BattleSide = "player" | "enemy";

export type BattleWinner = BattleSide | "draw";

// Enemies do not currently come with an explicit level, so the fight route derives one.
export type FightEnemy = Enemy & {
  level: number;
};

// Active statuses are runtime-only battle state layered on top of the move definition.
export type BattleStatus = MoveStatusEffect & {
  id: string;
  sourceMoveId: string;
  sourceSide: BattleSide;
  remainingTurns: number;
};

// This is the mutable combat snapshot the engine will operate on turn by turn.
export type BattleCombatant = {
  side: BattleSide;
  name: string;
  index: string;
  level: number;
  maxHealth: number;
  currentHealth: number;
  baseStats: CombatStats;
  statModifiers: Record<StatKey, number>;
  cooldowns: Record<string, number>;
  movesSinceSupercharge: number;
  nextSuperchargeAt: number;
  superchargeReady: boolean;
  activeStatuses: BattleStatus[];
  moves: Move[];
};

// A normalized action result lets the UI render logs/announcements without recomputing effects.
export type BattleActionSummary = {
  actor: BattleSide;
  target: BattleSide;
  moveId: string;
  moveName: string;
  qteMultiplier: number;
  wasSupercharged: boolean;
  damageDealt: number;
  selfDamageDealt: number;
  healingDone: number;
  otherHealingDone: number;
  appliedStatuses: BattleStatus[];
  expiredStatusIds: string[];
};

export type BattleState = {
  player: BattleCombatant;
  enemy: BattleCombatant;
  turn: BattleSide;
  winner: BattleWinner | null;
  turnCount: number;
  lastAction: BattleActionSummary | null;
};

// Seed data is the bridge between fetched API data and the engine's own state model.
export type BattleSeed = {
  player: Player;
  playerMoves: Move[];
  enemy: FightEnemy;
  enemyMoves: Move[];
};
