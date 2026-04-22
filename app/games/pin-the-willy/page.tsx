"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameLayout from "@/components/ui/GameLayout";
import GameOverScreen from "@/components/ui/GameOverScreen";
import Button from "@/components/ui/Button";
import { FERGIE_PLACEHOLDER } from "@/lib/images";

type EmojiType = "aubergine" | "laugh" | "unicorn";

type PinnedEmoji = {
  id: string;
  type: EmojiType;
  x: number;
  y: number;
};

const EMOJIS: Record<EmojiType, string> = {
  aubergine: "🍆",
  laugh: "😂",
  unicorn: "🦄",
};

export default function PinTheWilly() {
  const router = useRouter();
  const [pinned, setPinned] = useState<PinnedEmoji[]>([]);
  const [isBlindfolded, setIsBlindfolded] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [gameOver, setGameOver] = useState(false);

  const photoRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef<EmojiType | null>(null);

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      setGhostPos({ x: e.clientX, y: e.clientY });
    }

    function handleUp(e: PointerEvent) {
      if (!isDraggingRef.current) return;

      if (photoRef.current && dragTypeRef.current) {
        const rect = photoRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setPinned((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              type: dragTypeRef.current!,
              x,
              y,
            },
          ]);
        }
      }

      isDraggingRef.current = false;
      dragTypeRef.current = null;
      setGhostPos(null);
      setIsBlindfolded(false);
    }

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  function startDrag(type: EmojiType, x: number, y: number) {
    isDraggingRef.current = true;
    dragTypeRef.current = type;
    setGhostPos({ x, y });
    setIsBlindfolded(true);
  }

  function handleReset() {
    setPinned([]);
  }

  function handlePlayAgain() {
    setPinned([]);
    setGameOver(false);
  }

  return (
    <GameLayout title="Pin the Willy on Fergie">
      {gameOver ? (
        <GameOverScreen
          score="🍆 Pinned!"
          message="Well, that's one way to decorate Fergie."
          onPlayAgain={handlePlayAgain}
          onBackToMenu={() => router.push("/")}
        />
      ) : (
        <div className="flex flex-col items-center px-4 py-6 gap-6">
          <div
            ref={photoRef}
            className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-lg bg-amber-100 select-none"
            style={{ touchAction: "none" }}
          >
            <Image
              src={FERGIE_PLACEHOLDER}
              alt="Fergie"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {isBlindfolded && (
              <div className="absolute inset-0 bg-black z-10" />
            )}
            {pinned.map((p) => (
              <span
                key={p.id}
                className="absolute z-20 text-4xl select-none pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {EMOJIS[p.type]}
              </span>
            ))}
          </div>

          <div>
            <p className="text-center text-sm text-gray-500 mb-3 font-body">
              Drag an emoji and drop it onto Fergie!
            </p>
            <div className="flex gap-8 justify-center">
              {(Object.entries(EMOJIS) as [EmojiType, string][]).map(
                ([type, emoji]) => (
                  <button
                    key={type}
                    className="text-5xl select-none cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      startDrag(type, e.clientX, e.clientY);
                    }}
                  >
                    {emoji}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="primary" onClick={() => setGameOver(true)}>
              Done ✓
            </Button>
          </div>
        </div>
      )}

      {!gameOver && ghostPos && dragTypeRef.current && (
        <div
          className="fixed pointer-events-none z-50 text-5xl select-none"
          style={{
            left: ghostPos.x - 24,
            top: ghostPos.y - 24,
          }}
        >
          {EMOJIS[dragTypeRef.current]}
        </div>
      )}
    </GameLayout>
  );
}
