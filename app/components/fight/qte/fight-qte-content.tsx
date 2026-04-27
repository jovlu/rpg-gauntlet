import type { BattleQteSession } from "../../../lib/fight/qte-rules";
import { BubblePopQte } from "./bubble-pop-qte";
import { HoldReleaseQte } from "./hold-release-qte";
import { KeySequenceQte } from "./key-sequence-qte";
import { MashSpaceQte } from "./mash-space-qte";

type FightQteContentProps = {
  onComplete: (score: number) => void;
  session: BattleQteSession;
};

export function FightQteContent({
  onComplete,
  session,
}: FightQteContentProps) {
  switch (session.qte) {
    case "mash_spacebar":
      return (
        <MashSpaceQte
          durationMs={session.durationMs}
          onComplete={onComplete}
          targetCount={session.targetCount}
        />
      );

    case "click_bubbles":
      return (
        <BubblePopQte
          lifetimeMs={session.lifetimeMs}
          maxVisible={session.maxVisible}
          onComplete={onComplete}
          targetCount={session.targetCount}
        />
      );

    case "keyboard_buttons":
      return (
        <KeySequenceQte
          onComplete={onComplete}
          sequence={session.sequence}
          timeLimitMs={session.timeLimitMs}
        />
      );

    case "arrow_sequence":
      return (
        <KeySequenceQte
          onComplete={onComplete}
          sequence={session.sequence}
          timeLimitMs={session.timeLimitMs}
        />
      );

    case "hold_release":
      return (
        <HoldReleaseQte
          onComplete={onComplete}
          targetMs={session.targetMs}
          toleranceMs={session.toleranceMs}
        />
      );
  }
}
