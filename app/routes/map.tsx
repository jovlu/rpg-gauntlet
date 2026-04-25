import { useEffect, useState } from "react";

import type { Route } from "./+types/map";
import { MenuPanel } from "../components/menu-panel";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import "./home.css";
import "./map.css";

const levels = Array.from({ length: 5 }, (_, index) => index + 1);

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Map" },
    { name: "description", content: "Map screen for RPG Gauntlet." },
  ];
}

export default function Map() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    enableAmbientAudio();
  }, []);

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  return (
    <main className="home-screen map-layout px-5 py-6">
      <div className="map-toolbar">
        <button
          className="map-toolbar-button"
          type="button"
          onClick={() => setMenuOpen(menuOpen ? false : true)}
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
            Five encounters are waiting. Art can drop in later.
          </p>
        </div>

        <div className="map-grid">
          {levels.map((level) => (
            <button
              key={level}
              className="map-node"
              type="button"
              onFocus={playHoverSound}
              onMouseEnter={playHoverSound}
            >
              <div className="map-node-image">?</div>
              <p className="map-node-label">Level {level}</p>
              <p className="map-node-copy">Monster placeholder</p>
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
    </main>
  );
}
