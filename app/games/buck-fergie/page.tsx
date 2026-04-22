"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameLayout from "@/components/ui/GameLayout";
import GameOverScreen from "@/components/ui/GameOverScreen";
import Button from "@/components/ui/Button";
import Timer from "@/components/ui/Timer";
import { FERGIE_PLACEHOLDER } from "@/lib/images";

type Floater = { id: string; x: number; y: number };

const DURATION = 30;

function getScoreMessage(ml: number): string {
  if (ml <= 300) return "Barely a sip. Fergie's still sober — unacceptable.";
  if (ml <= 700) return "Buckin' hell, Fergie's feeling it.";
  if (ml <= 1200)
    return "Buckin' hell, Fergie won't remember much of this weekend.";
  return "You absolute legend. Fergie has ascended.";
}

export default function BuckFergie() {
  const router = useRouter();
  const [gameState, setGameState] = useState<"idle" | "playing" | "done">(
    "idle"
  );
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft === 0) {
      setGameState("done");
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  function handleStart() {
    setTapCount(0);
    setTimeLeft(DURATION);
    setFloaters([]);
    setBouncing(false);
    setGameState("playing");
  }

  function handleTap(e: React.PointerEvent) {
    if (gameState !== "playing") return;
    e.preventDefault();
    setTapCount((prev) => prev + 1);

    const id = Math.random().toString(36).slice(2);
    setFloaters((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(
      () => setFloaters((prev) => prev.filter((f) => f.id !== id)),
      1000
    );

    setBouncing(true);
    setTimeout(() => setBouncing(false), 150);
  }

  const ml = tapCount * 10;

  if (gameState === "done") {
    return (
      <GameLayout title="Buck Fergie">
        <GameOverScreen
          score={`You fed Fergie ${ml}ml of Buckfast!`}
          message={getScoreMessage(ml)}
          onPlayAgain={handleStart}
          onBackToMenu={() => router.push("/")}
        />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Buck Fergie">
      <div
        className="flex flex-col items-center justify-center flex-1 relative select-none"
        style={{ touchAction: "manipulation" }}
        onPointerDown={handleTap}
      >
        <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 pointer-events-none">
          <div className="bg-white rounded-xl px-4 py-2 shadow">
            <p className="font-display text-xl text-gray-700">{ml}ml 🍷</p>
          </div>
          {gameState === "playing" && <Timer seconds={timeLeft} />}
        </div>

        <div
          className="flex flex-col items-center mt-8 transition-transform duration-150"
          style={{ transform: bouncing ? "scale(1.12)" : "scale(1)" }}
        >
          <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-xl border-4 border-white">
            <Image
              src={FERGIE_PLACEHOLDER}
              alt="Fergie"
              fill
              className="object-cover"
              draggable={false}
              unoptimized
            />
          </div>
          <p className="text-6xl mt-3">🍷</p>
        </div>

        {gameState === "idle" && (
          <Button
            variant="primary"
            onClick={handleStart}
            className="mt-10 pointer-events-auto"
          >
            Start! 🍷
          </Button>
        )}

        {gameState === "playing" && (
          <p className="mt-6 text-gray-500 font-body pointer-events-none text-sm">
            Tap anywhere to feed Fergie!
          </p>
        )}

        {floaters.map((f) => (
          <div
            key={f.id}
            className="fixed font-display text-red-primary text-2xl pointer-events-none float-up z-50 select-none"
            style={{ left: f.x - 24, top: f.y - 16 }}
          >
            +10ml
          </div>
        ))}
      </div>
    </GameLayout>
  );
}
