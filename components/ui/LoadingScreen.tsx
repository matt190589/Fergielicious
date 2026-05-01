"use client";

import { useEffect, useState } from "react";

const LETTERS = ["S", "T", "A", "G", " ", "F", "E", "R", "G", "I", "E"];
const STAGGER_MS = 160;
const LETTER_ANIM_MS = 420;
const LAST_LETTER_END = (LETTERS.length - 1) * STAGGER_MS + LETTER_ANIM_MS;
const MIN_SHOW_MS = LAST_LETTER_END + 800;

const ASSETS = [
  "/images/fergie/fergie-pin.webp",
  "/images/fergie/liverpool-crest.jpg",
  "/images/fergie/fergie-boxing.webp",
  "/images/fergie/black-dildo.avif",
];

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  ).then(() => {});
}

export default function LoadingScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    preloadImages(ASSETS).then(() => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_SHOW_MS - elapsed);
      t1 = setTimeout(() => {
        setFading(true);
        t2 = setTimeout(() => setGone(true), 500);
      }, wait);
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-primary"
      style={{ transition: "opacity 0.5s ease", opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}
    >
      <div className="flex gap-2 sm:gap-3">
        {LETTERS.map((letter, i) =>
          letter === " " ? (
            <span key={i} style={{ fontSize: "clamp(4rem, 16vw, 7rem)", width: "0.4em", display: "inline-block" }} />
          ) : (
            <span
              key={i}
              className="font-display text-white leading-none"
              style={{
                fontSize: "clamp(4rem, 16vw, 7rem)",
                animation: `letter-drop ${LETTER_ANIM_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                animationDelay: `${i * STAGGER_MS + 150}ms`,
              }}
            >
              {letter}
            </span>
          )
        )}
      </div>
      <p
        className="font-body text-white/60 text-base mt-6"
        style={{
          animation: `letter-drop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
          animationDelay: `${LAST_LETTER_END + 100}ms`,
        }}
      >
        Loading…
      </p>
    </div>
  );
}
