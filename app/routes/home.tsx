import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/home";
import { MenuPanel } from "../components/menu-panel";
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

  const handleStartRun = () => {
    navigate("/map");
  };

  const handleExitGame = () => {
    if (typeof window !== "undefined") {
      window.close();
    }

    setMessage("Your browser blocked automatic closing. Close this tab to exit.");
  };

  const handleFullscreen = async () => {
    if (typeof document === "undefined") {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }

      setMessage(null);
    } catch {
      setMessage("Fullscreen was blocked. Try again after interacting with the page.");
    }
  };

  return (
    <main className="home-screen relative grid min-h-screen place-items-center px-5 py-6">
      <button
        className="home-utility-button"
        type="button"
        onClick={handleFullscreen}
        aria-label="Toggle fullscreen"
        title="Toggle fullscreen"
      >
        <Maximize2 aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
      </button>

      <MenuPanel
        primaryLabel="Start a new run"
        onPrimary={handleStartRun}
        onExit={handleExitGame}
        message={message}
      />
    </main>
  );
}
