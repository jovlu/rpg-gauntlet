import type { QteDefinition, QtesResponse } from "../../components/map/types";
import { apiUrl } from "../config";
import { fallbackQtes } from "./qte-data";

const supportedQteTypes = new Set<QteDefinition["qte"]>([
  "mash_spacebar",
  "click_bubbles",
  "keyboard_buttons",
  "hold_release",
  "arrow_sequence",
]);

function isSupportedQteDefinition(value: unknown): value is QteDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<QteDefinition>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    supportedQteTypes.has(candidate.qte as QteDefinition["qte"]) &&
    (typeof candidate.qteValue === "number" || Array.isArray(candidate.qteValue))
  );
}

function sanitizeQtes(qtes: unknown) {
  if (!Array.isArray(qtes)) {
    return fallbackQtes;
  }

  const supportedQtes = qtes.filter(isSupportedQteDefinition);
  return supportedQtes.length > 0 ? supportedQtes : fallbackQtes;
}

// Both combat and the temporary support page need the same resilient QTE loading
// behavior, so keep the fetch/fallback logic in one place.
export async function loadQtes() {
  try {
    const response = await fetch(apiUrl("/qtes"));

    if (!response.ok) {
      return fallbackQtes;
    }

    const data = (await response.json()) as QtesResponse;
    return sanitizeQtes(data.qtes);
  } catch {
    return fallbackQtes;
  }
}

export function getQteById(qtes: QteDefinition[], qteId: string) {
  return qtes.find((qte) => qte.id === qteId) ?? null;
}
