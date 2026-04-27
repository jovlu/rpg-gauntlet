import type { QteDefinition } from "../../components/map/types";

// Keep a local fallback so the fight flow still works if the backend QTE route
// is unavailable during frontend development.
export const fallbackQtes: QteDefinition[] = [
  {
    id: "mash_space",
    name: "Mash Space",
    qte: "mash_spacebar",
    qteValue: 5,
    description: "Mash the spacebar as many times as possible in 5 seconds.",
  },
  {
    id: "bubble_pop",
    name: "Bubble Pop",
    qte: "click_bubbles",
    qteValue: 7,
    description: "Click 7 random bubbles before they disappear.",
  },
  {
    id: "random_keys",
    name: "Random Keys",
    qte: "keyboard_buttons",
    qteValue: 8,
    description: "Press 8 random keyboard buttons in order.",
  },
  {
    id: "hold_release",
    name: "Hold And Release",
    qte: "hold_release",
    qteValue: 4,
    description: "Hold a key and release it as close to 4 seconds as possible.",
  },
  {
    id: "arrow_chain",
    name: "Arrow Chain",
    qte: "arrow_sequence",
    qteValue: 7,
    description: "Input a sequence of 7 random arrow directions.",
  },
];
