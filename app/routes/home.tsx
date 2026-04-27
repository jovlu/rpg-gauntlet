import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/home";
import { MenuPanel } from "../components/menu-panel";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import "./home.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet" },
    { name: "description", content: "Main menu for RPG Gauntlet." },
  ];
}

export default function Home() {
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    enableAmbientAudio();
  }, []);

  const handleFullscreen = async () => {
    if (typeof document === "undefined") {
      return false;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      setMessage(null);
      return true;
    } catch {
      setMessage("Fullscreen was blocked. Try again after interacting with the page.");
      return false;
    }
  };

  const handleStartRun = async () => {
    await handleFullscreen();
    navigate("/map");
  };

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  return (
    <main className="home-screen relative grid min-h-screen place-items-center px-5 py-6">
      <MenuPanel
        fullscreenLabel="Enter fullscreen"
        onFullscreen={() => {
          void handleFullscreen();
        }}
        primaryLabel="Start a new run"
        onPrimary={() => {
          void handleStartRun();
        }}
        onExit={handleExitGame}
        message={message}
      />
    </main>
  );
}
