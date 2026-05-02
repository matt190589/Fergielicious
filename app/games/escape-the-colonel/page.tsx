"use client";

import { useState, useEffect, useRef, useReducer } from "react";
import { useRouter } from "next/navigation";
import GameLayout from "@/components/ui/GameLayout";
import Button from "@/components/ui/Button";
import { FERGIE_BOXING, COLONEL, GRAVY } from "@/lib/images";

// ── constants ────────────────────────────────────────────────────────────────
const FINISH_H = 12;           // % from top = FINISH zone height
const FERGIE_R = 24;           // collision radius px
const COLONEL_R = 20;          // collision radius px
const GRAVY_R = 26;            // collision radius px
const PATROL_SPEED = 18;       // % of container width per second (base)
const PATROL_SPEED_VARIANCE = 0.4; // each patrol gets base * rnd(1-v, 1+v)
const TRACKER_SPEED = 7;       // % of container diagonal per second (base)
const GRAVY_SLOW = 0.4;        // speed multiplier when slowed
const GRAVY_SLOW_MS = 1000;
const TRACKER_WARN_MS = 500;

const GAME_OVER_MSGS = [
  "Kentucky Fried Fergie!",
  "Zingerrrr!",
  "That's stopped Fergie's gravy train.",
  "Chef Fergie got cooked!",
  "Poor Fergie, the Colonel's whipping boy again!",
];

// ── types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "playing" | "level-complete" | "game-over" | "won";

interface Colonel {
  id: string;
  kind: "patrol" | "tracker";
  x: number;    // % of container width
  y: number;    // % of container height
  vx: number;   // patrol: signed %/s; tracker: unused (direction computed each frame)
  active: boolean;
}

interface GravyStain {
  id: string;
  x: number;
  y: number;
  consumed: boolean;
}

interface WarningMarker {
  id: string;
  x: number;
  y: number;
}

interface LevelConfig {
  patrol: number;
  patrolMult: number;         // speed multiplier for standard patrol colonels
  patrolFastCount: number;    // how many of the patrol colonels use patrolFastMult
  patrolFastMult: number;     // speed multiplier for the fast subset
  preSpawnTrackers: number;   // trackers active at level start (no warning flash)
  trackerDelays: number[];    // additional trackers that spawn mid-level (with warning)
  trackerMult: number;        // tracker speed multiplier
  gravy: number;
}

// ── level table ──────────────────────────────────────────────────────────────
//  patrol patrolMult pFastN pFastM preSpawn trackerDelays                       tMult gravy
const LEVELS: LevelConfig[] = [
  { patrol: 1, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 0, trackerDelays: [],                       trackerMult: 1.0, gravy: 0 }, // 1
  { patrol: 2, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 0, trackerDelays: [],                       trackerMult: 1.0, gravy: 0 }, // 2
  { patrol: 2, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 0, trackerDelays: [],                       trackerMult: 1.0, gravy: 2 }, // 3 (+1 gravy)
  { patrol: 3, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 0, trackerDelays: [],                       trackerMult: 1.0, gravy: 2 }, // 4
  { patrol: 2, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 0, trackerDelays: [200],                    trackerMult: 1.0, gravy: 0 }, // 5 (+1 patrol)
  { patrol: 0, patrolMult: 1.0, patrolFastCount: 0, patrolFastMult: 1.0,   preSpawnTrackers: 2, trackerDelays: [200],                    trackerMult: 1.0, gravy: 0 }, // 6 (2 on screen + 1 generates)
  { patrol: 2, patrolMult: 1.5, patrolFastCount: 0, patrolFastMult: 1.5,   preSpawnTrackers: 0, trackerDelays: [200, 3200],              trackerMult: 1.0, gravy: 0 }, // 7 (patrols 50% faster)
  { patrol: 3, patrolMult: 1.5, patrolFastCount: 0, patrolFastMult: 1.5,   preSpawnTrackers: 0, trackerDelays: [200, 3200],              trackerMult: 1.5, gravy: 0 }, // 8 (+1 patrol)
  { patrol: 2, patrolMult: 1.5, patrolFastCount: 0, patrolFastMult: 1.5,   preSpawnTrackers: 2, trackerDelays: [200, 3200],              trackerMult: 2.2, gravy: 4 }, // 9 (2 trackers on screen + 2 generate)
  { patrol: 5, patrolMult: 1.5, patrolFastCount: 3, patrolFastMult: 2.25,  preSpawnTrackers: 2, trackerDelays: [200, 1700, 3200, 4700],  trackerMult: 2.2, gravy: 3 }, // 10 (3 fast + 2 normal patrols; 2 on screen + 4 generate)
];

// ── helpers ──────────────────────────────────────────────────────────────────
function rnd(lo: number, hi: number) {
  return Math.random() * (hi - lo) + lo;
}

function buildPatrols(cfg: LevelConfig): Colonel[] {
  const cols: Colonel[] = [];
  for (let i = 0; i < cfg.patrol; i++) {
    let y = 0, tries = 0;
    do {
      y = rnd(20, 78);
      tries++;
    } while (tries < 20 && cols.some((c) => Math.abs(c.y - y) < 15));

    const mult = i < cfg.patrolFastCount ? cfg.patrolFastMult : cfg.patrolMult;
    const variance = rnd(1 - PATROL_SPEED_VARIANCE, 1 + PATROL_SPEED_VARIANCE);
    const spd = PATROL_SPEED * mult * variance;
    const goRight = Math.random() < 0.5;
    cols.push({
      id: `p${i}-${Date.now()}`,
      kind: "patrol",
      x: goRight ? 5 : 88,
      y,
      vx: goRight ? spd : -spd,
      active: true,
    });
  }
  return cols;
}

function buildPreSpawnTrackers(count: number, fergieX: number, fergieY: number): Colonel[] {
  const trackers: Colonel[] = [];
  for (let i = 0; i < count; i++) {
    let sx = 0, sy = 0, tries = 0;
    do {
      sx = rnd(5, 88);
      sy = rnd(FINISH_H + 5, 88);
      const farFromFergie = Math.hypot(sx - fergieX, sy - fergieY) >= 30;
      const farFromOthers = trackers.every((t) => Math.hypot(t.x - sx, t.y - sy) >= 20);
      if (farFromFergie && farFromOthers) break;
      tries++;
    } while (tries < 25);
    trackers.push({
      id: `ps${i}-${Date.now()}`,
      kind: "tracker",
      x: sx,
      y: sy,
      vx: 0,
      active: true,
    });
  }
  return trackers;
}

function buildGravy(count: number, fx: number, fy: number): GravyStain[] {
  const list: GravyStain[] = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do {
      x = rnd(8, 84);
      y = rnd(22, 78);
      tries++;
    } while (
      tries < 30 &&
      (list.some((g) => Math.hypot(g.x - x, g.y - y) < 14) ||
        Math.hypot(x - fx, y - fy) < 15)
    );
    list.push({ id: `g${i}-${Date.now()}`, x, y, consumed: false });
  }
  return list;
}

// ── component ────────────────────────────────────────────────────────────────
export default function EscapeTheColonel() {
  const router = useRouter();

  // UI state
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOverMsg, setGameOverMsg] = useState("");
  const [warnings, setWarnings] = useState<WarningMarker[]>([]);
  const [gravySlowed, setGravySlowed] = useState(false);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  // Mutable game-loop state (no re-render on change)
  const colonelsRef = useRef<Colonel[]>([]);
  const gravyRef = useRef<GravyStain[]>([]);
  const fergieRef = useRef({ x: 50, y: 88, isDragging: false });
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const isRunning = useRef(false);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const timerHandles = useRef<ReturnType<typeof setTimeout>[]>([]);
  const gravySlowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── game loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") {
      isRunning.current = false;
      return;
    }

    isRunning.current = true;
    lastTsRef.current = 0;

    // Schedule tracker colonels for this level
    const cfg = LEVELS[levelRef.current - 1];
    cfg.trackerDelays.forEach((delay, i) => {
      const t = setTimeout(() => {
        if (!isRunning.current) return;
        const rect = playAreaRef.current?.getBoundingClientRect();
        const diag = rect ? Math.hypot(rect.width, rect.height) : 600;
        const minDist = 0.3 * diag;
        const fergie = fergieRef.current;

        let sx = 0, sy = 0, tries = 0;
        do {
          sx = rnd(5, 88);
          sy = rnd(FINISH_H + 5, 88);
          const dxPx = (sx - fergie.x) / 100 * (rect?.width ?? 360);
          const dyPx = (sy - fergie.y) / 100 * (rect?.height ?? 500);
          if (Math.hypot(dxPx, dyPx) >= minDist) break;
          tries++;
        } while (tries < 25);

        const warnId = `w${i}-${Date.now()}`;
        setWarnings((prev) => [...prev, { id: warnId, x: sx, y: sy }]);

        const t2 = setTimeout(() => {
          if (!isRunning.current) return;
          colonelsRef.current.push({
            id: `tr${i}-${Date.now()}`,
            kind: "tracker",
            x: sx,
            y: sy,
            vx: 0,
            active: true,
          });
          setWarnings((prev) => prev.filter((w) => w.id !== warnId));
        }, TRACKER_WARN_MS);
        timerHandles.current.push(t2);
      }, delay);
      timerHandles.current.push(t);
    });

    function loop(ts: number) {
      if (!isRunning.current) return;
      const delta = lastTsRef.current ? Math.min((ts - lastTsRef.current) / 1000, 0.05) : 0;
      lastTsRef.current = ts;

      const rect = playAreaRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const cfg = LEVELS[levelRef.current - 1];
      const fergie = fergieRef.current;

      // Move colonels
      for (const col of colonelsRef.current) {
        if (!col.active) continue;
        if (col.kind === "patrol") {
          col.x += col.vx * delta;
          if (col.x <= 3)  { col.x = 3;  col.vx =  Math.abs(col.vx); }
          if (col.x >= 93) { col.x = 93; col.vx = -Math.abs(col.vx); }
        } else {
          const dxPx = (fergie.x - col.x) / 100 * rect.width;
          const dyPx = (fergie.y - col.y) / 100 * rect.height;
          const dist = Math.hypot(dxPx, dyPx);
          if (dist > 1) {
            const diag = Math.hypot(rect.width, rect.height);
            const spd = (TRACKER_SPEED / 100) * diag * cfg.trackerMult * delta;
            col.x += (dxPx / dist) * (spd / rect.width) * 100;
            col.y += (dyPx / dist) * (spd / rect.height) * 100;
          }
        }
      }

      // Collision: Fergie ↔ colonels
      const fxPx = fergie.x / 100 * rect.width;
      const fyPx = fergie.y / 100 * rect.height;

      for (const col of colonelsRef.current) {
        if (!col.active) continue;
        const cxPx = col.x / 100 * rect.width;
        const cyPx = col.y / 100 * rect.height;
        if (Math.hypot(fxPx - cxPx, fyPx - cyPx) < FERGIE_R + COLONEL_R) {
          isRunning.current = false;
          timerHandles.current.forEach(clearTimeout);
          timerHandles.current = [];
          const msg = GAME_OVER_MSGS[Math.floor(Math.random() * GAME_OVER_MSGS.length)];
          setGameOverMsg(msg);
          setPhase("game-over");
          return;
        }
      }

      // Collision: Fergie ↔ gravy
      for (const g of gravyRef.current) {
        if (g.consumed) continue;
        const gxPx = g.x / 100 * rect.width;
        const gyPx = g.y / 100 * rect.height;
        if (Math.hypot(fxPx - gxPx, fyPx - gyPx) < FERGIE_R + GRAVY_R) {
          g.consumed = true;
          if (gravySlowTimer.current) clearTimeout(gravySlowTimer.current);
          setGravySlowed(true);
          gravySlowTimer.current = setTimeout(() => {
            setGravySlowed(false);
          }, GRAVY_SLOW_MS);
        }
      }

      // Check FINISH
      if (fergie.y <= FINISH_H) {
        isRunning.current = false;
        timerHandles.current.forEach(clearTimeout);
        timerHandles.current = [];
        const newScore = scoreRef.current + 100;
        scoreRef.current = newScore;
        setScore(newScore);
        setPhase(levelRef.current >= 10 ? "won" : "level-complete");
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
      rerender();
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      isRunning.current = false;
      cancelAnimationFrame(rafRef.current);
      timerHandles.current.forEach(clearTimeout);
      timerHandles.current = [];
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── level init ───────────────────────────────────────────────────────────
  function initLevel(lvl: number, currentScore: number) {
    isRunning.current = false;
    cancelAnimationFrame(rafRef.current);
    timerHandles.current.forEach(clearTimeout);
    timerHandles.current = [];
    if (gravySlowTimer.current) clearTimeout(gravySlowTimer.current);

    const cfg = LEVELS[lvl - 1];
    const start = { x: 50, y: 88 };
    colonelsRef.current = [
      ...buildPatrols(cfg),
      ...buildPreSpawnTrackers(cfg.preSpawnTrackers, start.x, start.y),
    ];
    gravyRef.current = buildGravy(cfg.gravy, start.x, start.y);
    fergieRef.current = { ...start, isDragging: false };
    levelRef.current = lvl;
    scoreRef.current = currentScore;

    setLevel(lvl);
    setScore(currentScore);
    setGravySlowed(false);
    setWarnings([]);
    setGameOverMsg("");
    setPhase("playing");
  }

  // ── pointer handlers ─────────────────────────────────────────────────────
  function handleFergiePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "playing") return;
    e.preventDefault();
    e.stopPropagation();
    fergieRef.current.isDragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleAreaPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!fergieRef.current.isDragging) return;
    const rect = playAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    fergieRef.current.x = Math.max(4, Math.min(93, ((e.clientX - rect.left) / rect.width) * 100));
    fergieRef.current.y = Math.max(1, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));
  }

  function handleAreaPointerUp() {
    fergieRef.current.isDragging = false;
  }

  // ── derived render data ──────────────────────────────────────────────────
  const fergie = fergieRef.current;
  const colonels = colonelsRef.current;
  const gravyStains = gravyRef.current;
  const isPlaying = phase === "playing";

  // ── game-over / win screens ──────────────────────────────────────────────
  if (phase === "game-over" || phase === "won") {
    const isWin = phase === "won";
    return (
      <GameLayout title="Escape the Colonel">
        <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 text-center gap-5">
          <div className="bg-red-primary text-white rounded-3xl px-5 py-6 shadow-xl w-full max-w-sm">
            <p className="font-display text-4xl sm:text-5xl tracking-wide">
              {isWin ? "🎉 You Win!" : "Game Over!"}
            </p>
            <p className="font-display text-2xl mt-2">
              {isWin ? "Congratulations, you helped Fergie save his secret sauce!" : gameOverMsg}
            </p>
            <p className="text-lg font-body mt-4 opacity-90">
              You scored <strong>{isWin ? 1000 : score}</strong> points.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button variant="primary" onClick={() => initLevel(1, 0)} className="w-full">
              Play Again
            </Button>
            <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
              Back to Menu
            </Button>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (phase === "level-complete") {
    return (
      <GameLayout title="Escape the Colonel">
        <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 text-center gap-5">
          <div className="bg-red-primary text-white rounded-3xl px-5 py-6 shadow-xl w-full max-w-sm">
            <p className="font-display text-5xl tracking-wide">Level {level}</p>
            <p className="font-display text-3xl mt-1">Complete! 🎉</p>
            <p className="text-xl font-body mt-4">+100 points</p>
            <p className="text-lg font-body opacity-80 mt-1">Total: {score} pts</p>
          </div>
          <Button variant="primary" onClick={() => initLevel(level + 1, score)} className="w-full max-w-xs">
            Level {level + 1} →
          </Button>
          <Button variant="secondary" onClick={() => router.push("/")} className="w-full max-w-xs">
            Back to Menu
          </Button>
        </div>
      </GameLayout>
    );
  }

  // ── idle / playing ────────────────────────────────────────────────────────
  return (
    <GameLayout title="Escape the Colonel">
      <div className="flex flex-col flex-1 items-center px-2 py-3 gap-3">
        {/* HUD */}
        {isPlaying && (
          <div className="flex gap-2 items-center w-full max-w-md px-1">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow shrink-0">
              <p className="font-display text-lg leading-none">Level {level}/10</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-1.5 shadow shrink-0">
              <p className="font-display text-lg leading-none">{score} pts</p>
            </div>
            {gravySlowed && (
              <div className="bg-amber-400 text-white rounded-xl px-3 py-1.5 shadow animate-pulse shrink-0">
                <p className="font-display text-lg leading-none">SLOWED!</p>
              </div>
            )}
          </div>
        )}

        {/* Play area */}
        <div
          ref={playAreaRef}
          className="relative w-full max-w-md rounded-xl overflow-hidden select-none"
          style={{
            background: `repeating-conic-gradient(#E11D2E 0% 25%, #ffffff 0% 50%) 0 0 / 44px 44px`,
            minHeight: 480,
            touchAction: "none",
          }}
          onPointerMove={handleAreaPointerMove}
          onPointerUp={handleAreaPointerUp}
          onPointerLeave={handleAreaPointerUp}
        >
          {/* FINISH zone */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-20"
            style={{
              height: `${FINISH_H}%`,
              background: "#8B0000",
              animation: "finishPulse 1.6s ease-in-out infinite",
            }}
          >
            <span
              className="font-display text-white tracking-widest"
              style={{ fontSize: "clamp(1.1rem, 4vw, 1.6rem)", textShadow: "0 0 10px rgba(255,255,255,0.7)" }}
            >
              FINISH
            </span>
          </div>

          {/* Gravy stains */}
          {gravyStains.map((g) =>
            g.consumed ? null : (
              <img
                key={g.id}
                src={GRAVY}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  width: 60,
                  height: 60,
                  transform: "translate(-50%, -50%)",
                  opacity: 0.8,
                  pointerEvents: "none",
                }}
              />
            )
          )}

          {/* Colonels */}
          {colonels.map((col) =>
            !col.active ? null : (
              <img
                key={col.id}
                src={COLONEL}
                alt="Colonel"
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${col.x}%`,
                  top: `${col.y}%`,
                  width: 50,
                  height: 50,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
                  pointerEvents: "none",
                }}
              />
            )
          )}

          {/* Tracker warning markers */}
          {warnings.map((w) => (
            <div
              key={w.id}
              style={{
                position: "absolute",
                left: `${w.x}%`,
                top: `${w.y}%`,
                width: 50,
                height: 50,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: "3px solid #E11D2E",
                animation: "warningPulse 0.125s ease-in-out infinite alternate",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
          ))}

          {/* Fergie */}
          {(isPlaying || phase === "idle") && (
            <div
              style={{
                position: "absolute",
                left: `${fergie.x}%`,
                top: `${fergie.y}%`,
                width: 56,
                height: 56,
                transform: "translate(-50%, -50%)",
                cursor: fergie.isDragging ? "grabbing" : "grab",
                touchAction: "none",
                zIndex: 10,
                filter: gravySlowed ? "sepia(0.5) saturate(2)" : "none",
                transition: gravySlowed ? "filter 0.1s" : "none",
              }}
              onPointerDown={handleFergiePointerDown}
            >
              <img
                src={FERGIE_BOXING}
                alt="Fergie"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "3px solid white",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          {/* Idle overlay */}
          {phase === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/55 z-30">
              <div className="bg-white/92 rounded-2xl px-5 py-4 text-center max-w-[280px] shadow-xl">
                <p className="font-display text-red-primary text-2xl leading-tight">Escape the Colonel!</p>
                <p className="font-body text-sm mt-2 text-gray-700 leading-snug">
                  Drag Fergie to the <strong>FINISH</strong> zone at the top.<br />
                  Avoid the Colonel 🍗 and watch out for gravy spills!
                </p>
                <p className="font-body text-xs mt-2 text-gray-500">10 levels · 100 pts each · max 1000</p>
              </div>
              <Button variant="primary" onClick={() => initLevel(1, 0)}>
                Start Game 🍗
              </Button>
            </div>
          )}
        </div>

        {isPlaying && (
          <p className="text-gray-500 font-body text-sm text-center">
            Drag Fergie to the FINISH zone — avoid the Colonel!
          </p>
        )}
      </div>
    </GameLayout>
  );
}
