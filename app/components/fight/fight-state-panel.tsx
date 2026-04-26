import { playHoverSound } from "../../lib/audio";
import "./fight-state-panel.css";

type FightStatePanelProps = {
  actionLabel: string;
  copy: string;
  kicker: string;
  onAction: () => void;
  title: string;
};

export function FightStatePanel({
  actionLabel,
  copy,
  kicker,
  onAction,
  title,
}: FightStatePanelProps) {
  return (
    <section className="fight-state-panel">
      <p className="fight-panel-kicker">{kicker}</p>
      <h1 className="fight-panel-title">{title}</h1>
      <p className="fight-panel-copy">{copy}</p>
      <button
        className="fight-toolbar-button"
        type="button"
        onClick={onAction}
        onFocus={playHoverSound}
        onMouseEnter={playHoverSound}
      >
        {actionLabel}
      </button>
    </section>
  );
}
