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

export type Move = {
  id: string;
  name: string;
  icon: string;
  iconName: string;
  iconIndex: string;
  qte?: string;
  qteValue?: number | string | null;
  description: string;
};

export type MovesResponse = {
  moves: Move[];
};

export type Enemy = {
  name: string;
  index: string;
  moves: string[];
  stats: CombatStats;
};
