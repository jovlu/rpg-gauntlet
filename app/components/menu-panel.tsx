import { playHoverSound } from "../lib/audio";
import "./menu-panel.css";

type MenuPanelProps = {
  primaryLabel: string;
  onPrimary: () => void;
  onExit: () => void;
  message?: string | null;
};

export function MenuPanel({
  primaryLabel,
  onPrimary,
  onExit,
  message = null,
}: MenuPanelProps) {
  const hoverProps = {
    onFocus: playHoverSound,
    onMouseEnter: playHoverSound,
  };

  return (
    <section
      className="menu-panel relative w-full max-w-[560px] border-4 border-[#7089bb] bg-linear-to-b from-[rgba(33,37,69,0.98)] to-[rgba(22,26,48,0.98)] px-[18px] py-[30px] text-center sm:px-7 sm:py-[36px]"
      aria-label="Main menu"
    >
      <p className="mb-3 font-display text-[1rem] font-bold uppercase tracking-[0.18em] text-[#7ad6ff] [text-shadow:0_0_12px_rgba(122,214,255,0.2)]">
        RPG Gauntlet
      </p>
      <h1 className="font-display text-[1.8rem] leading-[1.3] font-bold uppercase tracking-[0.12em] text-[#eef7ff] [text-shadow:3px_3px_0_#11182c] sm:text-[2.8rem]">
        Main Menu
      </h1>
      <p className="mx-auto mt-[18px] max-w-[28ch] text-[1.2rem] leading-[1.2] text-[#b8d8f4] sm:text-[1.35rem]">
        Step into the gauntlet or leave before the first door opens.
      </p>

      <div className="mt-7 grid gap-3">
        <button
          className="menu-action-button"
          type="button"
          onClick={onPrimary}
          {...hoverProps}
        >
          {primaryLabel}
        </button>
        <button
          className="menu-action-button menu-action-button-secondary"
          type="button"
          onClick={onExit}
          {...hoverProps}
        >
          Exit the game
        </button>
      </div>

      {message ? (
        <p className="menu-status" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
