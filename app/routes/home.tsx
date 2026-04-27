import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/home";
import { MenuPanel } from "../components/menu-panel";
import { enableAmbientAudio, playHoverSound } from "../lib/audio";
import { apiUrl } from "../lib/config";
import "./home.css";

const API_WAKE_CHECK_MS = 5000;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet" },
    { name: "description", content: "Main menu for RPG Gauntlet." },
  ];
}

export default function Home() {
  const [apiReady, setApiReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    enableAmbientAudio();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkApi = async () => {
      try {
        const response = await fetch(apiUrl("/player"));

        if (!response.ok) {
          throw new Error("API unavailable");
        }

        if (cancelled) {
          return;
        }

        setApiReady(true);
      } catch {
        if (cancelled) {
          return;
        }

        setApiReady(false);
        window.setTimeout(() => {
          void checkApi();
        }, API_WAKE_CHECK_MS);
      }
    };

    void checkApi();

    return () => {
      cancelled = true;
    };
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
    if (!apiReady) {
      return;
    }

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
        primaryDisabled={!apiReady}
        onFullscreen={() => {
          void handleFullscreen();
        }}
        primaryLabel={apiReady ? "Start a new run" : "API coming up..."}
        onPrimary={() => {
          void handleStartRun();
        }}
        onExit={handleExitGame}
        message={message ?? (!apiReady ? "The Render server is waking up. Try again in a moment." : null)}
      />
    </main>
  );
}
