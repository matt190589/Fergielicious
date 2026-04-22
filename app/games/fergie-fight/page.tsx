"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameLayout from "@/components/ui/GameLayout";
import GameOverScreen from "@/components/ui/GameOverScreen";
import Button from "@/components/ui/Button";
import Timer from "@/components/ui/Timer";
import { FERGIE_PLACEHOLDER } from "@/lib/images";
import { randomInt } from "@/lib/utils";

const DURATION = 40;

function getResultMessage(score: number): string {
  if (score === 0) return "Fergie didn't even feel it. Try harder!";
  if (score <= 5) return "A light warm-up. Fergie's barely sweating.";
  if (score <= 15) return "Not bad! Fergie's got a black eye.";
  if (score <= 25) return "Fergie's seeing stars. You absolute menace.";
  return "Fergie is unconscious. You've gone too far. Incredible.";
}

export default function FergieFight() {
  const router = useRouter();
  const [gameState, setGameState] = useState<"idle" | "playing" | "done">(
    "idle"
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);

  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  });

  const scheduleMove = useRef(() => {});

  scheduleMove.current = () => {
    if (gameStateRef.current !== "playing") return;
    const duration = randomInt(800, 1500);
    moveTimerRef.current = setTimeout(() => {
      setVisible(false);
      moveTimerRef.current = setTimeout(() => {
        if (gameStateRef.current !== "playing") return;
        setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
        setVisible(true);
        scheduleMove.current();
      }, 200);
    }, duration);
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
    setVisible(true);
    scheduleMove.current();
    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft === 0) {
      setGameState("done");
      setVisible(false);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  function handleHit() {
    if (!visible || gameState !== "playing") return;
    setScore((prev) => prev + 1);
    setVisible(false);
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    moveTimerRef.current = setTimeout(() => {
      if (gameStateRef.current !== "playing") return;
      setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
      setVisible(true);
      scheduleMove.current();
    }, 200);
  }

  function handleStart() {
    setScore(0);
    setTimeLeft(DURATION);
    setVisible(false);
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    setGameState("playing");
  }

  if (gameState === "done") {
    return (
      <GameLayout title="Fergie Fight">
        <GameOverScreen
          score={`${score} punch${score === 1 ? "" : "es"}! 🥊`}
          message={getResultMessage(score)}
          onPlayAgain={handleStart}
          onBackToMenu={() => router.push("/")}
        />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Fergie Fight">
      <div className="flex flex-col flex-1 items-center px-4 py-4 gap-4">
        <div className="flex justify-between items-center w-full max-w-md">
          <div className="bg-white rounded-xl px-4 py-2 shadow">
            <p className="font-display text-xl">🥊 {score}</p>
          </div>
          {gameState === "playing" && <Timer seconds={timeLeft} />}
        </div>

        <div
          className="relative w-full max-w-md rounded-2xl overflow-hidden fight-arena"
          style={{
            backgroundColor: "#D4A574",
            backgroundImage:
              "repeating-linear-gradient(180deg, transparent, transparent 30px, rgba(0,0,0,0.05) 30px, rgba(0,0,0,0.05) 32px)",
            minHeight: 360,
            touchAction: "none",
          }}
        >
          <div className="absolute inset-2 border-4 border-red-primary rounded-xl pointer-events-none" />
          <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none" />

          {visible && (
            <button
              className="absolute w-20 h-20 rounded-full overflow-hidden shadow-xl border-4 border-white active:scale-90 transition-transform"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                handleHit();
              }}
            >
              <Image
                src={FERGIE_PLACEHOLDER}
                alt="Fergie"
                fill
                className="object-cover"
                draggable={false}
                unoptimized
              />
            </button>
          )}

          {gameState === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
              <Button variant="primary" onClick={handleStart}>
                Start Fight! 🥊
              </Button>
            </div>
          )}
        </div>

        {gameState === "playing" && (
          <p className="text-gray-500 font-body text-sm">
            Tap Fergie to land a punch!
          </p>
        )}
      </div>
    </GameLayout>
  );
}
