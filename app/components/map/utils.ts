import type { Move } from "./types";

const ravenIcons = import.meta.glob(
  "../../assets/Free - Raven Fantasy Icons/Separated Files/32x32/*.png",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

export function getAbilityIconSrc(move: Move) {
  if (!move.iconIndex.trim()) {
    return null;
  }

  return (
    ravenIcons[
      `../../assets/Free - Raven Fantasy Icons/Separated Files/32x32/${move.iconIndex}.png`
    ] ?? null
  );
}

export function getAbilityIconLabel(move: Move) {
  const icon = move.icon.trim();

  if (icon) {
    return icon;
  }

  if (move.iconName.trim()) {
    return move.iconName.charAt(0).toUpperCase();
  }

  return move.name.charAt(0).toUpperCase();
}
