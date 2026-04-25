import { useEffect, useState } from "react";
import { Heart, Shield, Sparkles, Sword } from "lucide-react";

import type { Route } from "./+types/map";
import { MenuPanel } from "../components/menu-panel";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import "./home.css";
import "./map.css";

type StatKey = "health" | "attack" | "defense" | "magic";

const enemies = [
  {
    name: "Witch",
    imageSrc: "/monsters/witch.png",
  },
  {
    name: "Giant Spider",
    imageSrc: "/monsters/giant-spider.png",
  },
  {
    name: "Dragon",
    imageSrc: "/monsters/dragon.png",
  },
  {
    name: "Goblin Warrior",
    imageSrc: "/monsters/goblin-warrior.png",
  },
  {
    name: "Goblin Mage",
    imageSrc: "/monsters/goblin-mage.png",
  },
] as const;

const abilitySlots = [
  "Ability Slot 1",
  "Ability Slot 2",
  "Ability Slot 3",
  "Ability Slot 4",
] as const;

const statCards: {
  key: StatKey;
  label: string;
  Icon: typeof Heart;
}[] = [
  { key: "health", label: "Health", Icon: Heart },
  { key: "attack", label: "Attack", Icon: Sword },
  { key: "defense", label: "Defense", Icon: Shield },
  { key: "magic", label: "Magic", Icon: Sparkles },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Map" },
    { name: "description", content: "Map screen for RPG Gauntlet." },
  ];
}

export default function Map() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [xp, setXp] = useState(8);
  const [stats, setStats] = useState({
    health: 12,
    attack: 5,
    defense: 4,
    magic: 3,
  });

  useEffect(() => {
    enableAmbientAudio();
  }, []);

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  const handleSpendXp = (stat: StatKey) => {
    if (xp <= 0) {
      return;
    }

    setXp((currentXp) => currentXp - 1);
    setStats((currentStats) => ({
      ...currentStats,
      [stat]: currentStats[stat] + 1,
    }));
  };

  return (
    <main className="home-screen map-layout px-5 py-6">
      <div className="map-toolbar">
        <button
          className="map-toolbar-button"
          type="button"
          onClick={() => {
            setStatsOpen((open) => !open);
            setMenuOpen(false);
          }}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Stats
        </button>
        <button
          className="map-toolbar-button"
          type="button"
          onClick={() => {
            setMenuOpen((open) => !open);
            setStatsOpen(false);
          }}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Menu
        </button>
      </div>

      <section className="map-screen w-full max-w-[1100px]">
        <div className="map-header">
          <p className="map-kicker">World Map</p>
          <h1 className="map-title">Choose A Level</h1>
          <p className="map-copy">
            Five enemies stand between you and the castle.
          </p>
        </div>

        <div className="map-grid">
          {enemies.map((enemy, index) => (
            <button
              key={enemy.name}
              className="map-node"
              type="button"
              onFocus={playHoverSound}
              onMouseEnter={playHoverSound}
            >
              <div className="map-node-image">
                <img
                  className="map-node-sprite"
                  src={enemy.imageSrc}
                  alt={enemy.name}
                />
              </div>
              <p className="map-node-label">Level {index + 1}</p>
              <p className="map-node-copy">{enemy.name}</p>
            </button>
          ))}
        </div>
      </section>

      {menuOpen ? (
        <div className="map-overlay">
          <MenuPanel
            primaryLabel="Resume"
            onPrimary={() => {
              setMenuOpen(false);
              setMessage(null);
            }}
            onExit={handleExitGame}
            message={message}
          />
        </div>
      ) : null}

      {statsOpen ? (
        <div className="map-overlay">
          <section className="stats-panel" aria-label="Character menu">
            <div className="stats-header">
              <div>
                <p className="stats-kicker">Character</p>
                <h2 className="stats-title">Spend XP</h2>
              </div>
              <button
                className="stats-close"
                type="button"
                onClick={() => setStatsOpen(false)}
                onFocus={playHoverSound}
                onMouseEnter={playHoverSound}
              >
                Close
              </button>
            </div>

            <p className="stats-xp">XP Available: {xp}</p>

            <div className="stats-grid">
              {statCards.map(({ key, label, Icon }) => (
                <div key={key} className="stats-card">
                  <div className="stats-icon-wrap">
                    <Icon aria-hidden="true" className="stats-icon" strokeWidth={2.2} />
                  </div>
                  <p className="stats-label">{label}</p>
                  <p className="stats-value">{stats[key]}</p>
                  <button
                    className="stats-buy"
                    type="button"
                    onClick={() => handleSpendXp(key)}
                    onFocus={playHoverSound}
                    onMouseEnter={playHoverSound}
                    disabled={xp <= 0}
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>

            <div className="abilities-section">
              <p className="abilities-title">Abilities</p>
              <div className="abilities-grid">
                {abilitySlots.map((slot) => (
                  <div key={slot} className="ability-slot">
                    <div className="ability-slot-icon">?</div>
                    <p className="ability-slot-name">{slot}</p>
                    <p className="ability-slot-copy">Server placeholder</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
