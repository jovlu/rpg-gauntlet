import { useState } from "react";
import { Maximize2 } from "lucide-react";

import type { Route } from "./+types/home";
import "./home.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RPG Gauntlet" },
    { name: "description", content: "Main menu for RPG Gauntlet." },
  ];
}

export default function Home() {
  const [message, setMessage] = useState<string | null>(null);

  const handleStartRun = () => {
    setMessage("A new run has been selected. Hook the next screen into this action.");
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

      <section
        className="home-panel relative w-full max-w-[560px] border-4 border-[#7089bb] bg-linear-to-b from-[rgba(33,37,69,0.98)] to-[rgba(22,26,48,0.98)] px-[18px] py-[30px] text-center sm:px-7 sm:py-[36px]"
        aria-label="Main menu"
      >
        <p className="mb-3 font-display text-[1rem] font-bold uppercase tracking-[0.18em] text-[#7ad6ff] [text-shadow:0_0_12px_rgba(122,214,255,0.2)]">
          RPG Gauntlet
        </p>
        <h1 className="font-display text-[1.8rem] leading-[1.3] font-bold uppercase tracking-[0.12em] text-[#eef7ff] [text-shadow:3px_3px_0_#11182c] sm:text-[2.8rem]">
          Main Menu
        </h1>
        <p className="mx-auto mt-[18px] max-w-[28ch] text-[1.2rem] leading-[1.2] text-[#b8d8f4] sm:text-[1.35rem]">
          Step into the gauntlet or leave before the first door opens.
        </p>

        <div className="mt-7 grid gap-3">
          <button className="home-action-button" type="button" onClick={handleStartRun}>
            Start a new run
          </button>
          <button
            className="home-action-button home-action-button-secondary"
            type="button"
            onClick={handleExitGame}
          >
            Exit the game
          </button>
        </div>

        {message ? (
          <p className="home-status" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
