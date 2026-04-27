import { useEffect } from "react";
import { useNavigate } from "react-router";

import { FightStatePanel } from "../components/fight/fight-state-panel";
import { enableAmbientAudio } from "../lib/audio";
import type { Route } from "./+types/congrats";
import "./fight.css";
import "./home.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet Victory" },
    { name: "description", content: "Congratulations screen for clearing the gauntlet." },
  ];
}

export default function Congrats() {
  const navigate = useNavigate();

  useEffect(() => {
    enableAmbientAudio();
  }, []);

  return (
    <main className="home-screen fight-screen fight-screen-state px-5 py-6">
      <FightStatePanel
        actionLabel="Return To Main Menu"
        copy="You defeated all five monsters and cleared the gauntlet."
        kicker="Congratulations"
        onAction={() => navigate("/")}
        title="Run Complete"
      />
    </main>
  );
}
