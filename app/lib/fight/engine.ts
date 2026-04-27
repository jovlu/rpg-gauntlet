import type { CombatStats, Move, PlayerStats, StatKey } from "../../components/map/types";
import type {
  BattleActionSummary,
  BattleCombatant,
  BattleSeed,
  BattleSide,
  BattleState,
  BattleStatus,
  BattleWinner,
} from "./types";

export const MOVE_COOLDOWN_TURNS = 2;
export const DEFAULT_QTE_MULTIPLIER = 1;
export const MIN_SUPERCHARGE_TURNS = 2;
export const MAX_SUPERCHARGE_TURNS = 4;
export const MIN_SUPERCHARGE_MULTIPLIER = 0.5;
export const MAX_SUPERCHARGE_MULTIPLIER = 1.75;

type ResolveBattleActionOptions = {
  consumeSupercharge?: boolean;
  ignoreCooldown?: boolean;
  wasSupercharged?: boolean;
};

function toCombatStats(stats: CombatStats | PlayerStats): CombatStats {
  return {
    health: stats.health,
    attack: stats.attack,
    defense: stats.defense,
    magic: stats.magic,
  };
}

function createEmptyModifiers(): Record<StatKey, number> {
  return {
    health: 0,
    attack: 0,
    defense: 0,
    magic: 0,
  };
}

function createCooldownMap(moves: Move[]) {
  return Object.fromEntries(moves.map((move) => [move.id, 0])) as Record<string, number>;
}

function rollSuperchargeThreshold(rng = Math.random) {
  return MIN_SUPERCHARGE_TURNS + Math.floor(rng() * (MAX_SUPERCHARGE_TURNS - MIN_SUPERCHARGE_TURNS + 1));
}

function cloneStatus(status: BattleStatus): BattleStatus {
  return { ...status };
}

function cloneCombatant(combatant: BattleCombatant): BattleCombatant {
  return {
    ...combatant,
    baseStats: { ...combatant.baseStats },
    statModifiers: { ...combatant.statModifiers },
    cooldowns: { ...combatant.cooldowns },
    movesSinceSupercharge: combatant.movesSinceSupercharge,
    nextSuperchargeAt: combatant.nextSuperchargeAt,
    superchargeReady: combatant.superchargeReady,
    activeStatuses: combatant.activeStatuses.map(cloneStatus),
    moves: [...combatant.moves],
  };
}

function clampQteMultiplier(qteMultiplier: number) {
  return Math.max(0, Math.min(MAX_SUPERCHARGE_MULTIPLIER, qteMultiplier));
}

function createStatusId(sourceSide: BattleSide, moveId: string, stat: StatKey) {
  return `${sourceSide}-${moveId}-${stat}-${globalThis.crypto.randomUUID()}`;
}

function getOtherSide(side: BattleSide): BattleSide {
  return side === "player" ? "enemy" : "player";
}

function getWinner(player: BattleCombatant, enemy: BattleCombatant): BattleWinner | null {
  const playerDefeated = player.currentHealth <= 0;
  const enemyDefeated = enemy.currentHealth <= 0;

  if (playerDefeated && enemyDefeated) {
    return "draw";
  }

  if (enemyDefeated) {
    return "player";
  }

  if (playerDefeated) {
    return "enemy";
  }

  return null;
}

function recalculateModifiers(combatant: BattleCombatant) {
  const nextModifiers = createEmptyModifiers();

  for (const status of combatant.activeStatuses) {
    nextModifiers[status.stat] += status.amount;
  }

  combatant.statModifiers = nextModifiers;
}

export function getEffectiveStats(combatant: BattleCombatant): CombatStats {
  return {
    health: Math.max(1, combatant.baseStats.health + combatant.statModifiers.health),
    attack: Math.max(0, combatant.baseStats.attack + combatant.statModifiers.attack),
    defense: Math.max(0, combatant.baseStats.defense + combatant.statModifiers.defense),
    magic: Math.max(0, combatant.baseStats.magic + combatant.statModifiers.magic),
  };
}

export function getCurrentMaxHealth(combatant: BattleCombatant) {
  return getEffectiveStats(combatant).health;
}

function clampCurrentHealth(combatant: BattleCombatant) {
  combatant.currentHealth = Math.max(
    0,
    Math.min(combatant.currentHealth, getCurrentMaxHealth(combatant)),
  );
}

function rebuildCombatantState(combatant: BattleCombatant) {
  recalculateModifiers(combatant);
  clampCurrentHealth(combatant);
}

function getScalingTotal(move: Move, actorStats: CombatStats) {
  return (
    move.attackScaling * actorStats.attack +
    move.magicScaling * actorStats.magic +
    move.defenseScaling * actorStats.defense +
    move.healthScaling * actorStats.health
  );
}

// With no scaling configured, the move still needs a neutral multiplier so base-only
// effects such as flat buffs and heals continue to work.
function getScalingMultiplier(move: Move, actorStats: CombatStats) {
  const scalingTotal = getScalingTotal(move, actorStats);
  return scalingTotal === 0 ? 1 : scalingTotal;
}

function getScaledMagnitude(baseValue: number, move: Move, actorStats: CombatStats, qte: number) {
  if (baseValue === 0) {
    return 0;
  }

  return Math.round(baseValue * getScalingMultiplier(move, actorStats) * qte);
}

function applyDamage(combatant: BattleCombatant, amount: number) {
  combatant.currentHealth = Math.max(0, combatant.currentHealth - amount);
}

function applyHealing(combatant: BattleCombatant, amount: number) {
  combatant.currentHealth = Math.min(getCurrentMaxHealth(combatant), combatant.currentHealth + amount);
}

function applyStatuses(
  move: Move,
  actorSide: BattleSide,
  actor: BattleCombatant,
  target: BattleCombatant,
) {
  const appliedStatuses: BattleStatus[] = [];
  const skipActorTickIds = new Set<string>();

  for (const effect of move.statusEffects) {
    const scaledAmount = Math.round(effect.amount);

    if (scaledAmount === 0 || effect.durationRounds <= 0) {
      continue;
    }

    const recipient = effect.target === "self" ? actor : target;
    const nextStatus: BattleStatus = {
      ...effect,
      amount: scaledAmount,
      id: createStatusId(actorSide, move.id, effect.stat),
      sourceMoveId: move.id,
      sourceSide: actorSide,
      remainingTurns: effect.durationRounds,
    };

    recipient.activeStatuses.push(nextStatus);
    rebuildCombatantState(recipient);
    appliedStatuses.push(nextStatus);

    if (recipient.side === actor.side) {
      skipActorTickIds.add(nextStatus.id);
    }
  }

  return {
    appliedStatuses,
    skipActorTickIds,
  };
}

function tickCooldowns(combatant: BattleCombatant, usedMoveId: string) {
  for (const moveId of Object.keys(combatant.cooldowns)) {
    if (combatant.cooldowns[moveId] > 0) {
      combatant.cooldowns[moveId] -= 1;
    }
  }

  combatant.cooldowns[usedMoveId] = MOVE_COOLDOWN_TURNS;
}

function tickSupercharge(combatant: BattleCombatant, usedSupercharge: boolean) {
  if (usedSupercharge) {
    combatant.movesSinceSupercharge = 0;
    combatant.nextSuperchargeAt = rollSuperchargeThreshold();
    combatant.superchargeReady = false;
    return;
  }

  const nextCount = combatant.movesSinceSupercharge + 1;
  combatant.movesSinceSupercharge = Math.min(combatant.nextSuperchargeAt, nextCount);
  combatant.superchargeReady = nextCount >= combatant.nextSuperchargeAt;
}

function tickActorStatuses(combatant: BattleCombatant, skipIds: Set<string>) {
  const expiredStatusIds: string[] = [];

  combatant.activeStatuses = combatant.activeStatuses
    .map((status) => {
      if (skipIds.has(status.id)) {
        return status;
      }

      const remainingTurns = status.remainingTurns - 1;

      if (remainingTurns <= 0) {
        expiredStatusIds.push(status.id);
        return null;
      }

      return {
        ...status,
        remainingTurns,
      };
    })
    .filter((status): status is BattleStatus => Boolean(status));

  rebuildCombatantState(combatant);
  return expiredStatusIds;
}

export function createBattleCombatant(
  side: BattleSide,
  data: {
    index: string;
    level: number;
    moves: Move[];
    name: string;
    stats: CombatStats | PlayerStats;
  },
): BattleCombatant {
  const baseStats = toCombatStats(data.stats);

  return {
    side,
    name: data.name,
    index: data.index,
    level: data.level,
    maxHealth: baseStats.health,
    currentHealth: baseStats.health,
    baseStats,
    statModifiers: createEmptyModifiers(),
    cooldowns: createCooldownMap(data.moves),
    movesSinceSupercharge: 0,
    nextSuperchargeAt: rollSuperchargeThreshold(),
    superchargeReady: false,
    activeStatuses: [],
    moves: data.moves,
  };
}

export function createBattleState(seed: BattleSeed): BattleState {
  return {
    player: createBattleCombatant("player", {
      name: seed.player.name,
      index: seed.player.index,
      level: seed.player.level,
      moves: seed.playerMoves,
      stats: seed.player.stats,
    }),
    enemy: createBattleCombatant("enemy", {
      name: seed.enemy.name,
      index: seed.enemy.index,
      level: seed.enemy.level,
      moves: seed.enemyMoves,
      stats: seed.enemy.stats,
    }),
    turn: "player",
    winner: null,
    turnCount: 1,
    lastAction: null,
  };
}

export function getMoveById(combatant: BattleCombatant, moveId: string) {
  return combatant.moves.find((move) => move.id === moveId) ?? null;
}

export function getAvailableMoves(combatant: BattleCombatant) {
  return combatant.moves.filter((move) => (combatant.cooldowns[move.id] ?? 0) <= 0);
}

export function canUseMove(combatant: BattleCombatant, moveId: string) {
  return (combatant.cooldowns[moveId] ?? 0) <= 0 && Boolean(getMoveById(combatant, moveId));
}

export function isCombatantSuperchargeReady(combatant: BattleCombatant) {
  return combatant.superchargeReady;
}

export function chooseRandomMove(combatant: BattleCombatant, rng = Math.random) {
  const availableMoves = getAvailableMoves(combatant);

  if (availableMoves.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(rng() * availableMoves.length);
  return availableMoves[randomIndex] ?? null;
}

function buildActionSummary(input: {
  actor: BattleSide;
  target: BattleSide;
  move: Move;
  qteMultiplier: number;
  wasSupercharged: boolean;
  damageDealt: number;
  selfDamageDealt: number;
  healingDone: number;
  otherHealingDone: number;
  appliedStatuses: BattleStatus[];
  expiredStatusIds: string[];
}): BattleActionSummary {
  return {
    actor: input.actor,
    target: input.target,
    moveId: input.move.id,
    moveName: input.move.name,
    qteMultiplier: input.qteMultiplier,
    wasSupercharged: input.wasSupercharged,
    damageDealt: input.damageDealt,
    selfDamageDealt: input.selfDamageDealt,
    healingDone: input.healingDone,
    otherHealingDone: input.otherHealingDone,
    appliedStatuses: input.appliedStatuses,
    expiredStatusIds: input.expiredStatusIds,
  };
}

export function resolveBattleAction(
  state: BattleState,
  moveId: string,
  qteMultiplier = DEFAULT_QTE_MULTIPLIER,
  options: ResolveBattleActionOptions = {},
) {
  if (state.winner) {
    return state;
  }

  const actorSide = state.turn;
  const targetSide = getOtherSide(actorSide);
  const nextState: BattleState = {
    ...state,
    player: cloneCombatant(state.player),
    enemy: cloneCombatant(state.enemy),
    lastAction: null,
  };
  const actor = nextState[actorSide];
  const target = nextState[targetSide];
  const move = getMoveById(actor, moveId);

  if (!move || (!options.ignoreCooldown && !canUseMove(actor, moveId))) {
    return state;
  }

  const qte = clampQteMultiplier(qteMultiplier);
  const wasSupercharged = options.wasSupercharged ?? false;
  const consumeSupercharge = options.consumeSupercharge ?? wasSupercharged;
  const actorStats = getEffectiveStats(actor);

  const physicalDamage = Math.max(
    0,
    getScaledMagnitude(move.physicalDamage, move, actorStats, qte) - getEffectiveStats(target).defense,
  );
  const magicalDamage = Math.max(
    0,
    getScaledMagnitude(move.magicalDamage, move, actorStats, qte),
  );
  const trueDamage = Math.max(0, getScaledMagnitude(move.trueDamage, move, actorStats, qte));
  const damageDealt = physicalDamage + magicalDamage + trueDamage;

  const physicalSelfDamage = Math.max(
    0,
    getScaledMagnitude(move.physicalDamageSelf, move, actorStats, qte) - actorStats.defense,
  );
  const magicalSelfDamage = Math.max(
    0,
    getScaledMagnitude(move.magicalDamageSelf, move, actorStats, qte),
  );
  const trueSelfDamage = Math.max(
    0,
    getScaledMagnitude(move.trueDamageSelf, move, actorStats, qte),
  );
  const selfDamageDealt = physicalSelfDamage + magicalSelfDamage + trueSelfDamage;

  const healingDone = Math.max(0, getScaledMagnitude(move.healSelf, move, actorStats, qte));
  const otherHealingDone = Math.max(0, getScaledMagnitude(move.healOther, move, actorStats, qte));
  const trueSelfHealing = Math.max(0, getScaledMagnitude(move.trueHealSelf, move, actorStats, qte));
  const trueOtherHealing = Math.max(0, getScaledMagnitude(move.trueHealOther, move, actorStats, qte));
  const totalHealingDone = healingDone + trueSelfHealing;
  const totalOtherHealingDone = otherHealingDone + trueOtherHealing;

  applyDamage(target, damageDealt);
  applyDamage(actor, selfDamageDealt);
  applyHealing(actor, totalHealingDone);
  applyHealing(target, totalOtherHealingDone);

  const { appliedStatuses, skipActorTickIds } = applyStatuses(
    move,
    actorSide,
    actor,
    target,
  );
  const expiredStatusIds = tickActorStatuses(actor, skipActorTickIds);
  tickCooldowns(actor, move.id);
  tickSupercharge(actor, consumeSupercharge);
  rebuildCombatantState(actor);
  rebuildCombatantState(target);

  nextState.winner = getWinner(nextState.player, nextState.enemy);
  nextState.lastAction = buildActionSummary({
    actor: actorSide,
    target: targetSide,
    move,
    qteMultiplier: qte,
    wasSupercharged,
    damageDealt,
    selfDamageDealt,
    healingDone: totalHealingDone,
    otherHealingDone: totalOtherHealingDone,
    appliedStatuses,
    expiredStatusIds,
  });
  nextState.turn = nextState.winner ? actorSide : targetSide;
  nextState.turnCount = state.turnCount + 1;

  return nextState;
}
