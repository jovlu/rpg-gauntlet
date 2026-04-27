import { useEffect, useState } from "react";

import monstersSheet from "../../assets/32rogues/monsters.png";
import roguesSheet from "../../assets/32rogues/rogues.png";
import { getCurrentMaxHealth, getEffectiveStats } from "../../lib/fight/engine";
import type { BattleCombatant } from "../../lib/fight/types";
import { SheetSprite } from "../sprites/sheet-sprite";
import { CombatantFrame } from "./combatant-frame";
import "./battle-stage.css";

type BattleStageProps = {
  enemy: BattleCombatant;
  messageDetail: string | null;
  messageHeadline: string;
  player: BattleCombatant;
  showMessage: boolean;
  stageMessageId: number;
};

const HEADLINE_TYPE_MS = 22;
const DETAIL_TYPE_MS = 12;
const DETAIL_START_DELAY_MS = 420;
const MIN_MESSAGE_VISIBLE_MS = 2400;

export function BattleStage({
  enemy,
  messageDetail,
  messageHeadline,
  player,
  showMessage,
  stageMessageId,
}: BattleStageProps) {
  const enemyStats = getEffectiveStats(enemy);
  const playerStats = getEffectiveStats(player);
  const [detailVisible, setDetailVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [typedDetail, setTypedDetail] = useState("");

  useEffect(() => {
    if (!showMessage || stageMessageId <= 0) {
      setMessageVisible(false);
      setDetailVisible(false);
      setTypedHeadline("");
      setTypedDetail("");
      return;
    }

    setMessageVisible(true);
    setDetailVisible(false);
    setTypedHeadline("");
    setTypedDetail("");

    if (typeof window === "undefined") {
      setTypedHeadline(messageHeadline);
      setTypedDetail(messageDetail ?? "");
      setDetailVisible(Boolean(messageDetail));
      return;
    }

    let headlineIndex = 0;
    let detailIndex = 0;
    const nextDetail = messageDetail ?? "";
    let detailTypeTimer: number | null = null;

    const headlineTimer = window.setInterval(() => {
      headlineIndex += 1;
      setTypedHeadline(messageHeadline.slice(0, headlineIndex));

      if (headlineIndex >= messageHeadline.length) {
        window.clearInterval(headlineTimer);
      }
    }, HEADLINE_TYPE_MS);

    const detailTimer = window.setTimeout(() => {
      setDetailVisible(Boolean(nextDetail));

      if (!nextDetail) {
        return;
      }

      detailTypeTimer = window.setInterval(() => {
        detailIndex += 1;
        setTypedDetail(nextDetail.slice(0, detailIndex));

        if (detailIndex >= nextDetail.length) {
          if (detailTypeTimer !== null) {
            window.clearInterval(detailTypeTimer);
            detailTypeTimer = null;
          }
        }
      }, DETAIL_TYPE_MS);
    }, DETAIL_START_DELAY_MS);

    const computedVisibleMs = Math.max(
      MIN_MESSAGE_VISIBLE_MS,
      messageHeadline.length * HEADLINE_TYPE_MS + nextDetail.length * DETAIL_TYPE_MS + 900,
    );
    const hideTimer = window.setTimeout(() => {
      setMessageVisible(false);
    }, computedVisibleMs);

    return () => {
      window.clearInterval(headlineTimer);
      if (detailTypeTimer !== null) {
        window.clearInterval(detailTypeTimer);
      }
      window.clearTimeout(detailTimer);
      window.clearTimeout(hideTimer);
    };
  }, [messageDetail, messageHeadline, showMessage, stageMessageId]);

  return (
    <section className="fight-stage" aria-label="Battle scene">
      <div className="fight-stage-sky" />
      {messageVisible ? (
        <div
          className={`fight-stage-message ${detailVisible ? "fight-stage-message-detail-visible" : ""}`}
        >
          <p className="fight-stage-message-title">{typedHeadline}</p>
          <p className="fight-stage-message-detail">{typedDetail}</p>
        </div>
      ) : null}

      {/* Enemy and player use separate sheets, so the stage keeps sprite wiring centralized. */}
      <div className="fight-enemy-side">
        <CombatantFrame
          currentHealth={enemy.currentHealth}
          side="enemy"
          level={enemy.level}
          maxHealth={getCurrentMaxHealth(enemy)}
          name={enemy.name}
          stats={enemyStats}
          statuses={enemy.activeStatuses}
        />
        <div className="fight-platform fight-platform-enemy">
          <SheetSprite
            className="fight-sprite fight-sprite-enemy"
            image={monstersSheet}
            index={enemy.index}
            label={enemy.name}
            scale={6}
            sheetHeight={416}
            sheetWidth={384}
          />
        </div>
      </div>

      {/* The player sprite is mirrored so both combatants face each other on the stage. */}
      <div className="fight-player-side">
        <CombatantFrame
          currentHealth={player.currentHealth}
          side="player"
          level={player.level}
          maxHealth={getCurrentMaxHealth(player)}
          movesSinceSupercharge={player.movesSinceSupercharge}
          name={player.name}
          nextSuperchargeAt={player.nextSuperchargeAt}
          stats={playerStats}
          statuses={player.activeStatuses}
          superchargeReady={player.superchargeReady}
        />
        <div className="fight-platform fight-platform-player">
          <SheetSprite
            className="fight-sprite fight-sprite-player"
            image={roguesSheet}
            index={player.index}
            label={player.name}
            scale={6}
            sheetHeight={224}
            sheetWidth={224}
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      </div>
    </section>
  );
}
