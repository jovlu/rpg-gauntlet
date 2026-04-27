import { useEffect, useState } from "react";

import { playHoverSound } from "../../lib/audio";
import type { Move } from "./types";
import { getAbilityIconLabel, getAbilityIconSrc } from "./utils";

type SwapPanelProps = {
  equippedMoves: Move[];
  message?: string | null;
  move: Move;
  onBack: () => void;
  onReplaceMove: (replacementMoveId: string) => void;
  unlockedMoves: Move[];
};

export function SwapPanel({
  equippedMoves,
  message,
  move,
  onBack,
  onReplaceMove,
  unlockedMoves,
}: SwapPanelProps) {
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const iconSrc = getAbilityIconSrc(move);
  const replacementOptions = unlockedMoves.filter(
    (candidate) =>
      candidate.id === move.id ||
      !equippedMoves.some((equippedMove) => equippedMove.id === candidate.id),
  );
  const maxVisibleOptions = 2;
  const maxStartIndex = Math.max(0, replacementOptions.length - maxVisibleOptions);
  const visibleOptions = replacementOptions.slice(
    visibleStartIndex,
    visibleStartIndex + maxVisibleOptions,
  );

  useEffect(() => {
    setVisibleStartIndex(0);
  }, [move.id, unlockedMoves]);

  const handleScrollUp = () => {
    setVisibleStartIndex((current) => Math.max(0, current - 1));
  };

  const handleScrollDown = () => {
    setVisibleStartIndex((current) => Math.min(maxStartIndex, current + 1));
  };

  return (
    <section className="stats-panel swap-panel" aria-label="Swap ability">
      <div className="stats-header">
        <div>
          <p className="stats-kicker">Abilities</p>
          <h2 className="stats-title">Swap Ability</h2>
        </div>
        <button
          className="stats-close"
          type="button"
          onClick={onBack}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Back
        </button>
      </div>

      <div className="swap-panel-card">
        <div className="ability-slot-icon swap-panel-icon">
          {iconSrc ? (
            <img
              alt={move.iconName || move.name}
              className="ability-slot-icon-image"
              src={iconSrc}
            />
          ) : (
            getAbilityIconLabel(move)
          )}
        </div>
        <div className="swap-panel-copy">
          <p className="swap-panel-name">{move.name}</p>
          <p className="swap-panel-description">{move.description}</p>
        </div>
      </div>

      <div className="swap-panel-box">
        <p className="swap-panel-label">Replacement Ability</p>
        <p className="swap-panel-text">
          Choose one unlocked ability to replace {move.name}.
        </p>
        {message ? <p className="stats-message">{message}</p> : null}
        {replacementOptions.length > 0 ? (
          <>
            <div className="swap-panel-scroll">
              <button
                className="stats-buy swap-panel-scroll-button"
                disabled={visibleStartIndex <= 0}
                type="button"
                onClick={handleScrollUp}
                onFocus={playHoverSound}
                onMouseEnter={playHoverSound}
              >
                Up
              </button>
              <p className="swap-panel-scroll-status">
                {Math.min(replacementOptions.length, visibleStartIndex + 1)}-
                {Math.min(replacementOptions.length, visibleStartIndex + visibleOptions.length)} /{" "}
                {replacementOptions.length}
              </p>
              <button
                className="stats-buy swap-panel-scroll-button"
                disabled={visibleStartIndex >= maxStartIndex}
                type="button"
                onClick={handleScrollDown}
                onFocus={playHoverSound}
                onMouseEnter={playHoverSound}
              >
                Down
              </button>
            </div>
            <div className="swap-panel-options">
            {visibleOptions.map((replacementMove) => {
              const replacementIconSrc = getAbilityIconSrc(replacementMove);

              return (
                <button
                  key={replacementMove.id}
                  className="swap-panel-option"
                  type="button"
                  onClick={() => onReplaceMove(replacementMove.id)}
                  onFocus={playHoverSound}
                  onMouseEnter={playHoverSound}
                >
                  <div className="ability-slot-icon swap-panel-option-icon">
                    {replacementIconSrc ? (
                      <img
                        alt={replacementMove.iconName || replacementMove.name}
                        className="ability-slot-icon-image"
                        src={replacementIconSrc}
                      />
                    ) : (
                      getAbilityIconLabel(replacementMove)
                    )}
                  </div>
                  <div className="swap-panel-option-copy">
                    <p className="swap-panel-option-name">{replacementMove.name}</p>
                    <p className="swap-panel-option-description">{replacementMove.description}</p>
                  </div>
                </button>
              );
            })}
            </div>
          </>
        ) : (
          <p className="swap-panel-text">
            No other unlocked abilities are available for this slot yet.
          </p>
        )}
      </div>
    </section>
  );
}
