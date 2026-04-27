import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { QteSessionPlayer } from "../components/fight/qte/qte-session-player";
import type { QteDefinition } from "../components/map/types";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import { loadQtes } from "../lib/fight/load-qtes";
import { createBattleQteSession } from "../lib/fight/qte-rules";
import type { Route } from "./+types/support-qtes";
import "../components/fight/qte/fight-qte.css";
import "./support-qtes.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "QTE Support Lab" },
    { name: "description", content: "Temporary QTE testing page." },
  ];
}

export default function SupportQtes() {
  const navigate = useNavigate();
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [qtes, setQtes] = useState<QteDefinition[]>([]);
  const [selectedQteId, setSelectedQteId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [sessionSeed, setSessionSeed] = useState(0);

  useEffect(() => {
    enableAmbientAudio();
    void (async () => {
      const loadedQtes = await loadQtes();
      setQtes(loadedQtes);
      setSelectedQteId((current) => current ?? loadedQtes[0]?.id ?? null);
    })();
  }, []);

  const selectedQte = useMemo(
    () => qtes.find((qte) => qte.id === selectedQteId) ?? null,
    [qtes, selectedQteId],
  );

  const session = useMemo(() => {
    if (!selectedQte) {
      return null;
    }

    return createBattleQteSession(
      selectedQte,
      { id: `support-${selectedQte.id}-${sessionSeed}`, name: "Support Test Move" },
      selectedLevel,
    );
  }, [selectedLevel, selectedQte, sessionSeed]);

  const resetSession = () => {
    setLastScore(null);
    setSessionSeed((current) => current + 1);
  };

  return (
    <main className="support-qte-screen px-5 py-6">
      <div className="support-qte-toolbar">
        <button
          className="support-qte-toolbar-button"
          type="button"
          onClick={() => navigate("/")}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Exit Lab
        </button>
        <button
          className="support-qte-toolbar-button"
          type="button"
          onClick={resetSession}
          onFocus={playHoverSound}
          onMouseEnter={playHoverSound}
        >
          Reset QTE
        </button>
      </div>

      <div className="support-qte-layout">
        <aside className="support-qte-sidebar">
          <p className="support-qte-kicker">Temporary Support Page</p>
          <h1 className="support-qte-title">QTE Lab</h1>
          <p className="support-qte-copy">
            Select a QTE, pick a level, and run it in isolation.
          </p>
          <label className="support-qte-level-label">
            Battle Level
            <input
              className="support-qte-level-input"
              max={5}
              min={1}
              type="range"
              value={selectedLevel}
              onChange={(event) => {
                setSelectedLevel(Number(event.target.value));
                setSessionSeed((current) => current + 1);
              }}
            />
            <span>{selectedLevel}</span>
          </label>
          <div className="support-qte-list">
            {qtes.map((qte) => (
              <button
                key={qte.id}
                className={`support-qte-list-button ${qte.id === selectedQteId ? "support-qte-list-button-active" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedQteId(qte.id);
                  setLastScore(null);
                  setSessionSeed((current) => current + 1);
                }}
              >
                <span>{qte.name}</span>
                <small>{qte.qte}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="support-qte-preview">
          {session ? (
            <QteSessionPlayer
              mode="inline"
              title={`${session.definition.name} - Level ${selectedLevel}`}
              onResolved={(score) => {
                setLastScore(score);
              }}
              session={session}
            />
          ) : null}

          <div className="support-qte-results">
            <p className="support-qte-results-label">Last Result</p>
            <p className="support-qte-results-value">
              {lastScore === null ? "Not completed yet" : `${Math.round(lastScore * 100)}%`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
