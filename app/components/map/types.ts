export type StatKey = "health" | "attack" | "defense" | "magic";

export type PlayerStats = Record<StatKey, number> & { xp: number };

export type Player = {
  name: string;
  index: string;
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
  description: string;
};

export type MovesResponse = {
  moves: Move[];
};

export type Enemy = {
  name: string;
  index: string;
};
