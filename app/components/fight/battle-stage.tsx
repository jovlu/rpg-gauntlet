import monstersSheet from "../../assets/32rogues/monsters.png";
import roguesSheet from "../../assets/32rogues/rogues.png";
import type { Enemy, Player } from "../map/types";
import { SheetSprite } from "../sprites/sheet-sprite";
import { CombatantFrame } from "./combatant-frame";
import "./battle-stage.css";

type FightEnemy = Enemy & { level: number };

type BattleStageProps = {
  enemy: FightEnemy;
  player: Player;
};

export function BattleStage({ enemy, player }: BattleStageProps) {
  return (
    <section className="fight-stage" aria-label="Battle scene">
      <div className="fight-stage-sky" />

      <div className="fight-enemy-side">
        <CombatantFrame
          side="enemy"
          level={enemy.level}
          name={enemy.name}
          stats={enemy.stats}
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

      <div className="fight-player-side">
        <CombatantFrame
          side="player"
          level={player.level}
          name={player.name}
          stats={player.stats}
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
