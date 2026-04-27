export type StatKey = "health" | "attack" | "defense" | "magic";

export type CombatStats = Record<StatKey, number>;

export type PlayerStats = CombatStats & { xp: number };

export type Player = {
  name: string;
  index: string;
  level: number;
  moves: string[];
  stats: PlayerStats;
};

export type PlayerResponse = {
  player: Player;
};

export type MoveEffectTarget = "self" | "enemy";

// Keep this aligned with the backend QTE registry so move payloads stay typed end-to-end.
export type MoveQteType =
  | ""
  | "mash_spacebar"
  | "click_bubbles"
  | "keyboard_buttons"
  | "hold_release"
  | "arrow_sequence";

export type QteValue = number | string[];

export type QteDefinition = {
  id: string;
  name: string;
  qte: Exclude<MoveQteType, "">;
  qteValue: QteValue;
  description: string;
};

export type MoveStatusEffect = {
  target: MoveEffectTarget;
  stat: StatKey;
  amount: number;
  durationRounds: number;
};

// This mirrors the `/moves` payload from the backend combat schema.
// The engine will later decide how each base value is scaled and applied.
export type Move = {
  id: string;
  name: string;
  icon: string;
  iconName: string;
  iconIndex: string;
  qte: MoveQteType;
  qteValue?: number | string | null;
  description: string;
  durationRounds: number;
  physicalDamage: number;
  magicalDamage: number;
  trueDamage: number;
  physicalDamageSelf: number;
  magicalDamageSelf: number;
  trueDamageSelf: number;
  healSelf: number;
  healOther: number;
  trueHealSelf: number;
  trueHealOther: number;
  attackScaling: number;
  magicScaling: number;
  defenseScaling: number;
  healthScaling: number;
  statusEffects: MoveStatusEffect[];
};

export type MovesResponse = {
  moves: Move[];
};

export type QtesResponse = {
  qtes: QteDefinition[];
};

export type UnlockedMovesResponse = {
  unlockedMoves: string[];
};

export type PlayerMovesResponse = {
  moves: string[];
};

export type Enemy = {
  name: string;
  index: string;
  moves: string[];
  stats: CombatStats;
};
