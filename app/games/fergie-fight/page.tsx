"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameLayout from "@/components/ui/GameLayout";
import GameOverScreen from "@/components/ui/GameOverScreen";
import Button from "@/components/ui/Button";
import Timer from "@/components/ui/Timer";
import { FERGIE_BOXING, BLACK_DILDO } from "@/lib/images";
import { randomInt } from "@/lib/utils";

const DURATION = 20;
const DILDO_WINDOW_MS = 720;
const DILDO_CHANCE = 0.3;
const SWIPE_THRESHOLD = 50;

function getResultMessage(score: number, whacks: number): string {
  if (whacks >= 4) return `Fergie jabbed you ${whacks} times with his big black dick. Who's really winning here?`;
  if (score === 0) return "Fergie didn't even feel it. Try harder!";
  if (score <= 5) return "A light warm-up. Fergie's barely sweating.";
  if (score <= 15) return "Not bad! Fergie's got a three back eyes.";
  if (score <= 25) return "Fergie's battered. Ole, Ole, Ole";
  return "Fergie KOed!";
}

export default function FergieFight() {
  const router = useRouter();
  const [gameState, setGameState] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [dildoWhacks, setDildoWhacks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);
  const [dildoVisible, setDildoVisible] = useState(false);
  const [feedback, setFeedback] = useState<"dodged" | "whacked" | null>(null);

  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStateRef = useRef(gameState);
  const dildoActiveRef = useRef(false);
  const swipeStartXRef = useRef<number | null>(null);

  useEffect(() => { gameStateRef.current = gameState; });

  const showFeedbackRef = useRef((_type: "dodged" | "whacked") => {});
  const resumeAfterDildo = useRef(() => {});
  const scheduleDecision = useRef(() => {});
  const scheduleMove = useRef(() => {});

  useEffect(() => {
    showFeedbackRef.current = (type: "dodged" | "whacked") => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback(type);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 600);
    };

    resumeAfterDildo.current = () => {
      if (gameStateRef.current !== "playing") return;
      moveTimerRef.current = setTimeout(() => {
        if (gameStateRef.current !== "playing") return;
        setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
        setVisible(true);
        scheduleMove.current();
      }, 750);
    };

    // Shared "dildo or reshow Fergie" decision — runs whenever Fergie hides,
    // whether by natural timer or because the player landed a hit.
    scheduleDecision.current = () => {
      moveTimerRef.current = setTimeout(() => {
        if (gameStateRef.current !== "playing") return;
        if (Math.random() < DILDO_CHANCE) {
          dildoActiveRef.current = true;
          setDildoVisible(true);
          moveTimerRef.current = setTimeout(() => {
            if (dildoActiveRef.current) {
              dildoActiveRef.current = false;
              setDildoWhacks((prev) => prev + 1);
              showFeedbackRef.current("whacked");
            }
            setDildoVisible(false);
            resumeAfterDildo.current();
          }, DILDO_WINDOW_MS);
        } else {
          setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
          setVisible(true);
          scheduleMove.current();
        }
      }, 200);
    };

    scheduleMove.current = () => {
      if (gameStateRef.current !== "playing") return;
      moveTimerRef.current = setTimeout(() => {
        setVisible(false);
        scheduleDecision.current();
      }, randomInt(400, 800));
    };
  });

  useEffect(() => {
    if (gameState !== "playing") return;
    scheduleMove.current();
    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft === 0) {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      dildoActiveRef.current = false;
      const t = setTimeout(() => {
        setGameState("done");
        setVisible(false);
        setDildoVisible(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [gameState, timeLeft]);

  function handleHit() {
    if (!visible || gameState !== "playing") return;
    setScore((prev) => prev + 1);
    setVisible(false);
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    scheduleDecision.current();
  }

  function handleArenaPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (gameState !== "playing") return;
    swipeStartXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleArenaPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (swipeStartXRef.current === null) return;
    const deltaX = e.clientX - swipeStartXRef.current;
    swipeStartXRef.current = null;

    if (dildoActiveRef.current && deltaX > SWIPE_THRESHOLD) {
      dildoActiveRef.current = false;
      setDildoVisible(false);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      showFeedbackRef.current("dodged");
      resumeAfterDildo.current();
    }
  }

  function handleStart() {
    setScore(0);
    setDildoWhacks(0);
    setTimeLeft(DURATION);
    setPosition({ x: randomInt(5, 80), y: randomInt(5, 80) });
    setVisible(true);
    setDildoVisible(false);
    setFeedback(null);
    dildoActiveRef.current = false;
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setGameState("playing");
  }

  if (gameState === "done") {
    return (
      <GameLayout title="Fergie Fight">
        <GameOverScreen
          score={`🥊 ${score} punch${score === 1 ? "" : "es"} · 🍆 ${dildoWhacks} whack${dildoWhacks === 1 ? "" : "s"}`}
          message={getResultMessage(score, dildoWhacks)}
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
            <p className="font-display text-xl">🥊 {score} · 🍆 {dildoWhacks}</p>
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
          onPointerDown={handleArenaPointerDown}
          onPointerUp={handleArenaPointerUp}
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
                src={FERGIE_BOXING}
                alt="Fergie"
                fill
                className="object-cover"
                draggable={false}
                unoptimized
              />
            </button>
          )}

          {dildoVisible && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <Image
                src={BLACK_DILDO}
                alt=""
                width={90}
                height={160}
                className="object-contain"
                style={{ width: 90, height: "auto" }}
                unoptimized
              />
              <p className="font-display text-white text-3xl drop-shadow-lg animate-pulse">
                SWIPE RIGHT →
              </p>
            </div>
          )}

          {feedback === "dodged" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="font-display text-green-300 text-5xl drop-shadow-lg">
                DODGED! ✓
              </p>
            </div>
          )}

          {feedback === "whacked" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-600/30">
              <p className="font-display text-white text-5xl drop-shadow-lg">
                WHACK!
              </p>
            </div>
          )}

          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-2xl px-6">
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-center space-y-1">
                <p className="font-display text-white text-base sm:text-lg">🥊 Tap Fergie to land a punch</p>
                <p className="font-display text-white text-base sm:text-lg">🍆 Swipe right to dodge the dildo</p>
                <p className="font-body text-white/70 text-xs sm:text-sm">You have under a second to dodge — don&apos;t get caught!</p>
              </div>
              <Button variant="primary" onClick={handleStart}>
                Start Fight! 🥊
              </Button>
            </div>
          )}
        </div>

        {gameState === "playing" && (
          <p className="text-gray-500 font-body text-sm text-center">
            Tap Fergie · Swipe right to dodge the dildo!
          </p>
        )}
      </div>
    </GameLayout>
  );
}
