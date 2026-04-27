import type { BattleQteSession } from "../../../lib/fight/qte-rules";
import { QteSessionPlayer } from "./qte-session-player";
import "./fight-qte.css";

type FightQteOverlayProps = {
  onComplete: (score: number) => void;
  session: BattleQteSession | null;
};

export function FightQteOverlay({
  onComplete,
  session,
}: FightQteOverlayProps) {
  if (!session) {
    return null;
  }

  return <QteSessionPlayer mode="overlay" onResolved={onComplete} session={session} />;
}
