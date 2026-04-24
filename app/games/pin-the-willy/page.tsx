"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameLayout from "@/components/ui/GameLayout";
import Button from "@/components/ui/Button";
import { FERGIE_PIN, LIVERPOOL_CREST } from "@/lib/images";

type PinType = "aubergine" | "laugh" | "liverpool";

type PlacedItem = {
  type: PinType;
  x: number;
  y: number;
};

const EMOJIS: Partial<Record<PinType, string>> = {
  aubergine: "🍆",
  laugh: "😂",
};

const PIN_TYPES: PinType[] = ["aubergine", "laugh", "liverpool"];

const CAPTIONS = [
  "Well, that's one way to decorate Fergie.",
  "Fergie's never looked so well-hung.",
  "Now THAT'S what you call a member of the party.",
  "A stroke of genius. Fergie's impressed.",
  "Fergie's got a schlong way to go, but you're helping.",
];

function PinItemDisplay({
  type,
  size,
}: {
  type: PinType;
  size: "picker" | "ghost" | "modal";
}) {
  if (type === "liverpool") {
    const px = size === "modal" ? 60 : 72;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={LIVERPOOL_CREST}
        alt="Liverpool FC"
        width={px}
        height={px}
        className="object-contain rounded-full"
        draggable={false}
      />
    );
  }
  const cls = size === "modal" ? "text-6xl" : "text-7xl";
  return <span className={cls}>{EMOJIS[type]}</span>;
}

export default function PinTheWilly() {
  const router = useRouter();
  const [placed, setPlaced] = useState<PlacedItem | null>(null);
  const [caption, setCaption] = useState("");
  const [isBlindfolded, setIsBlindfolded] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const photoRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef<PinType | null>(null);

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
          setPlaced({ type: dragTypeRef.current!, x, y });
          setCaption(CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)]);
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

  function startDrag(type: PinType, x: number, y: number) {
    isDraggingRef.current = true;
    dragTypeRef.current = type;
    setGhostPos({ x, y });
    setIsBlindfolded(true);
  }

  return (
    <GameLayout title="Pin the Willy on Fergie">
      <div className="flex flex-col items-center px-4 py-6 gap-6">
        <div
          ref={photoRef}
          className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-lg bg-amber-100 select-none"
          style={{ touchAction: "none" }}
        >
          <Image
            src={FERGIE_PIN}
            alt="Fergie"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {isBlindfolded && (
            <div className="absolute inset-0 bg-black z-10" />
          )}
        </div>

        <div>
          <p className="text-center text-sm text-gray-500 mb-3 font-body">
            Drag an emoji and drop it onto Fergie!
          </p>
          <div className="flex gap-8 justify-center items-center">
            {PIN_TYPES.map((type) => (
              <button
                key={type}
                className="select-none cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startDrag(type, e.clientX, e.clientY);
                }}
              >
                <PinItemDisplay type={type} size="picker" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {ghostPos && dragTypeRef.current && (
        <div
          className="fixed pointer-events-none z-50 select-none"
          style={{
            left: ghostPos.x - 36,
            top: ghostPos.y - 36,
          }}
        >
          <PinItemDisplay type={dragTypeRef.current} size="ghost" />
        </div>
      )}

      {placed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-5 w-full max-w-sm">
            <h2 className="font-display text-3xl text-red-600 tracking-wide">
              Result!
            </h2>
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
              <Image
                src={FERGIE_PIN}
                alt="Fergie"
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: `${placed.x}%`,
                  top: `${placed.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <PinItemDisplay type={placed.type} size="modal" />
              </div>
            </div>
            <p className="font-body text-gray-600 text-center text-lg">
              {caption}
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => router.push("/")}
                className="flex-1 min-w-0"
              >
                ← Menu
              </Button>
              <Button
                variant="primary"
                onClick={() => setPlaced(null)}
                className="flex-1 min-w-0"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
