import monstersSheet from "../../assets/32rogues/monsters.png";
import roguesSheet from "../../assets/32rogues/rogues.png";
import { getCurrentMaxHealth, getEffectiveStats } from "../../lib/fight/engine";
import type { BattleCombatant } from "../../lib/fight/types";
import { SheetSprite } from "../sprites/sheet-sprite";
import { CombatantFrame } from "./combatant-frame";
import "./battle-stage.css";

type BattleStageProps = {
  enemy: BattleCombatant;
  player: BattleCombatant;
};

export function BattleStage({ enemy, player }: BattleStageProps) {
  const enemyStats = getEffectiveStats(enemy);
  const playerStats = getEffectiveStats(player);

  return (
    <section className="fight-stage" aria-label="Battle scene">
      <div className="fight-stage-sky" />

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
          name={player.name}
          stats={playerStats}
          statuses={player.activeStatuses}
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
