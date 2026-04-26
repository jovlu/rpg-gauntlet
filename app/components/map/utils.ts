import type { Move } from "./types";

export function getAbilityIconLabel(move: Move) {
  const icon = move.icon.trim();

  if (icon) {
    return icon;
  }

  return move.name.charAt(0).toUpperCase();
}
