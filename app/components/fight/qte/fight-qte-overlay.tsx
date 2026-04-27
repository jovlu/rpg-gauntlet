import type { BattleQteSession } from "../../../lib/fight/qte-rules";
import { FightQteContent } from "./fight-qte-content";
import { QteShell } from "./qte-shell";
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

  return (
    <div className="fight-qte-overlay">
      <QteShell
        description={session.definition.description}
        prompt={session.prompt}
        title={session.definition.name}
      >
        <FightQteContent onComplete={onComplete} session={session} />
      </QteShell>
    </div>
  );
}
