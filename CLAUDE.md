# CLAUDE.md

This file provides guidance to Claude Code when working on the **Fergielicious** project.

---

## Project Overview

Fergielicious is a **frontend-only**, mobile-friendly web app built in **Next.js (App Router)** with **TypeScript** and **Tailwind CSS**. It is a lighthearted party game app themed around a friend called Fergie, containing three mini-games the user can choose from.

There is **no backend, no database, and no user accounts**. All state is in-memory (React state). Scores are not persisted between sessions unless explicitly scoped otherwise.

---

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React `useState` / `useReducer` — no external state library needed
- **Animations:** CSS transitions + `requestAnimationFrame` where needed. `framer-motion` may be added if complex animation becomes necessary — ask before adding it.
- **Icons/Emojis:** Native emoji characters (🍆 😂 🦄 🥊) — no icon library required.

### Dependencies Policy

Keep dependencies minimal. Do not add a new npm package without flagging it first. Prefer native browser APIs (Pointer Events, `requestAnimationFrame`, CSS animations).

---

## Design System

### Colour Palette

- **Primary red:** `#E11D2E` (use Tailwind's `red-600` as a close match, or add a custom colour to `tailwind.config`)
- **White:** `#FFFFFF`
- **Off-white / cream background:** `#FFF8F5` for subtle contrast
- **Black:** `#000000` — used only for the "blindfold" overlay in Pin the Willy
- **Accent (optional):** a darker red `#8B0000` for hover/pressed states

### Typography

- **Headings / titles:** a fun display font — use **"Bangers"** or **"Fredoka"** from Google Fonts (loaded via `next/font/google`)
- **Body:** a clean sans-serif — **"Fredoka"** (regular weight) or system sans-serif
- Headings should feel playful, bold, and slightly rotated/skewed where it adds personality.

### Visual Tone

- Bold, cartoonish, party-vibes.
- Generous use of red backgrounds with white text (and vice versa).
- Buttons should feel chunky and tappable (large tap targets, rounded corners, slight shadow).
- Should work well on mobile — design mobile-first.

---

## App Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, global styles
│   ├── page.tsx                # Home / welcome screen with game selection
│   ├── globals.css             # Tailwind directives + custom CSS vars
│   └── games/
│       ├── pin-the-willy/
│       │   └── page.tsx
│       ├── buck-fergie/
│       │   └── page.tsx
│       └── fergie-fight/
│           └── page.tsx
├── components/
│   ├── ui/                     # Reusable: Button, Card, ScoreDisplay, GameOverScreen
│   └── games/                  # Game-specific components
├── lib/
│   └── utils.ts                # Helpers (random number, format score, etc.)
└── public/
    └── images/
        └── fergie/             # Placeholder Fergie photos during dev
```

### Routing

Each mini-game lives on its own route under `/games/*`. The home page links to each.

---

## Shared Components (build these first)

### `<Button>`

Chunky, rounded, red-and-white, large tap target. Variants: `primary` (red bg, white text), `secondary` (white bg, red text, red border).

### `<GameLayout>`

Wraps each game page. Includes:

- A small **"← Back to Menu"** link in the top-left corner.
- The game title.
- A slot for the game itself.

### `<GameOverScreen>`

Shown at the end of each game. Props:

- `score: number | string`
- `message: string` (the funny pun / outcome text)
- `onPlayAgain: () => void`
- `onBackToMenu: () => void`

Two buttons: **"Play Again"** (primary) and **"Back to Menu"** (secondary).

### `<Timer>`

A countdown display. Props: `seconds: number`, `onComplete: () => void`. Shows time remaining prominently.

---

## Home / Welcome Screen (`/`)

- Large title: **"Fergielicious"** in the display font, red-on-white or white-on-red.
- Short welcome blurb, e.g. _"Welcome to Fergielicious — three mini-games in honour of the legend himself. Pick your poison."_
- Three large tiled buttons, one per game, each linking to its route:
  1. 🍆 **Pin the Willy on Fergie**
  2. 🍷 **Buck Fergie**
  3. 🥊 **Fergie Fight**

Every button should have an emoji, a title, and a one-line teaser.

---

## Game 1: Pin the Willy on Fergie

**Route:** `/games/pin-the-willy`

### Concept

The classic "pin the tail on the donkey", but with emojis and a blindfold effect.

### Mechanics

1. Display a photo of Fergie (use any placeholder image in `public/images/fergie/` during development — e.g. `public/images/fergie/placeholder.jpg`).
2. Below the photo, show three draggable emojis: **🍆 (aubergine)**, **😂 (laughing face)**, **🦄 (unicorn)**.
3. When the user **starts dragging** an emoji, the photo becomes black (blindfold effect — overlay a full-opacity black layer over the image, or set image opacity to 0 with a black background behind it).
4. When the user **releases** the emoji over the photo, the blindfold is removed and the emoji is "pinned" at the drop coordinates (rendered as an absolutely-positioned element inside the photo container).
5. The user can place multiple emojis. Previously pinned emojis remain visible.
6. A **"Reset"** button clears all pinned emojis. A **"Done"** button ends the round and shows a `<GameOverScreen>` with a silly message (no numeric score — this game is about the result itself). Example message: _"Well, that's one way to decorate Fergie."_

### Technical Notes

- Use **Pointer Events** (`onPointerDown`, `onPointerMove`, `onPointerUp`) rather than HTML5 drag-and-drop — pointer events work consistently on both mouse and touch without the quirks of the native drag API.
- The blindfold should activate on `pointerdown` of an emoji and deactivate on `pointerup`.
- Pinned emojis are stored in state as `{ id: string, type: 'aubergine' | 'laugh' | 'unicorn', x: number, y: number }[]`, with `x`/`y` stored as **percentages** of the photo container (so they stay positioned correctly on resize).
- The photo container should have `position: relative` and pinned emojis `position: absolute`.
- Prevent default on pointer events inside the draggable area to stop scrolling on mobile during a drag.

---

## Game 2: Buck Fergie

**Route:** `/games/buck-fergie`

### Concept

Tap-as-many-times-as-possible game to "feed Fergie Buckfast".

### Mechanics

1. Display a cartoon-style image/illustration of Fergie holding a bottle of wine. (Use a placeholder image during dev — a simple emoji or placeholder illustration is fine.)
2. Below or around the image, a large tappable area (ideally the whole screen is the tap target, excluding the header/back button).
3. A **30-second timer** starts when the user taps "Start" (or on first tap — your call, default to a "Start" button).
4. Each tap = **10ml of Buckfast**. Track count in state.
5. Optionally, give visual feedback on each tap — a brief scale bounce on Fergie, a little "+10ml" floating text, or the wine bottle tipping.
6. When the timer hits 0, freeze input and show `<GameOverScreen>` with:
   - Score: _"You fed Fergie \*\*{count _ 10}ml\*_ of Buckfast!"_
   - A pun/message chosen based on score bracket, e.g.:
     - `0–300ml`: _"Barely a sip. Fergie's still sober — unacceptable."_
     - `310–700ml`: _"Buckin' hell, Fergie's feeling it."_
     - `710–1200ml`: _"Buckin' hell, Fergie won't remember much of this weekend."_
     - `1210ml+`: _"You absolute legend. Fergie has ascended."_

### Technical Notes

- Use `setInterval` or a `useEffect` + `setTimeout` countdown. Clean up on unmount.
- The tap handler should use `onPointerDown` (faster than `onClick` on mobile — no 300ms delay).
- **Do not double-fire** on mobile: use `onPointerDown` only, not both pointer and click.
- Use `touch-action: manipulation` on the tap area to eliminate double-tap zoom.

---

## Game 3: Fergie Fight

**Route:** `/games/fergie-fight`

### Concept

Whack-a-mole with Fergie's head in a boxing ring.

### Mechanics

1. A background styled as a boxing ring (red ropes, a canvas floor — keep it simple with CSS/divs; no need for elaborate art).
2. Fergie's head (placeholder image) appears at a random position within the ring, stays visible for **800–1500ms**, then disappears and reappears somewhere else — repeat.
3. Duration: **40 seconds**.
4. Each successful tap on Fergie's head = **+1 point** and the head immediately disappears and respawns elsewhere.
5. The user's cursor on desktop should be a **boxing glove 🥊** — implement with a custom CSS cursor (can use an emoji-rendered SVG as a data URI, or hide the native cursor and render a glove image that follows the pointer). On mobile, no cursor is needed — tapping is enough.
6. When time runs out, show `<GameOverScreen>` with the punch count and a message like _"{score} punches! Fergie's seeing stars."_

### Technical Notes

- Represent Fergie's position as `{ x: number, y: number }` in percentages of the ring container.
- Use `setTimeout` to schedule the next move; randomise both the position and the visible duration within the given range.
- Ensure the head can't spawn partially off-screen — clamp coordinates to e.g. 5%–85% of the container to account for the head's size.
- Clean up all timers in a `useEffect` cleanup function — this is critical to avoid leaks when the user navigates away mid-game.
- Custom cursor approach:
  ```css
  .fight-arena {
    cursor:
      url("/cursors/glove.png") 16 16,
      auto;
  }
  ```
  Place a small boxing-glove PNG (~32×32) in `public/cursors/`. A simple one can be generated or sourced during development.

---

## Navigation Rules

- **Every game route** must have a "← Back to Menu" link/button visible at all times (handled by `<GameLayout>`).
- **Every `<GameOverScreen>`** must offer both "Play Again" (restarts the game state in place) and "Back to Menu".
- Navigation should be instant — no loading states needed since everything is client-side.
- Mark game pages with `"use client"` at the top since they all use state and event handlers.

---

## Code Style

- TypeScript strict mode. No `any` unless genuinely necessary and commented.
- Prefer functional components and hooks.
- Keep components small; extract anything over ~150 lines.
- Tailwind classes first; only drop into `globals.css` for things Tailwind can't cleanly do (custom cursors, keyframes).
- Use `clsx` or template strings for conditional classes — do not add `clsx` as a dep just for one use; inline ternaries are fine.
- File names: `kebab-case.tsx` for route files, `PascalCase.tsx` for components.

---

## Development Workflow

- Run dev server: `npm run dev`
- Lint: `npm run lint`
- Build check before committing significant changes: `npm run build`
- Placeholder images live in `public/images/fergie/` — real images will be swapped in later; keep image references centralised (e.g. a `lib/images.ts` constants file) to make swapping easy.

---

## Out of Scope (do not build unless asked)

- User accounts, auth, persistence, leaderboards.
- Sound effects / music (can be added later).
- Backend API routes.
- Sharing to social media.
- Analytics.

---

## Open Questions / Things to Confirm With User Before Implementing

- Final Fergie images (placeholders are fine for now).
- Whether to add a global high-score tracker within the session (currently: no).
- Whether to add a short sound effect on taps/hits (currently: no).

## Escape the colonel

- We all know how much Fergie loved his days at KFC
- But now the colonel is back, can you help Fergie escape the Colonel?
- The concept of the game is simple, a Fergie icon or avatar starts at the bottom of the screen and the user has to move Fergie up the top of the screen.
- Design - it would be great if the background that Fergie had to move across was red and white squares. The top of the screen should have an area called FINISH that finishes the level when Fergie reaches it.

## Assets required

- Fergie icon /public/images/fergie/fergie-boxing.webp
- Colonel head - This what Fergie has to avoid, if Fergie gets caught by the colonel, the game is over /public/images/fergie/colonel.jpeg
- Gravy spill - slows Fergie down /public/images/fergie/gravy.png
-
- The game will have 10 levels of increasing difficulty with the final level being almost impossible
- Level 1 - Colonel move from left to right on the screen at a slow rate and back again when it reaches the screens edge
- Level 2 - Two colonels, one starts on the right and the other on the left and they move from side to side
- Level 3 - Two colonels like level 2 but the first gravy stain appears. The gravy stain should appear randomly on the game screen
- Level 4 - Three colonels moving from side to side and two random gravy stains
- Level 5 - One colonel with the side to side funtionality and a new tracking colonel that tracks and moves towards the Fergie icon at a slow rate. It's important that it's slow that the user can move away easily
- Level 6 - No side to side colonels but two tracking colonels. The first colonel should start tracking immediately and the second one should start tracking after 3 seconds
- Level 7 - Two side to side colonels and two tracking colonels with the same start time intervals as level 6
- Level 8 - Two side to side colonels and two tracking colonels but at a 50% higher speed that any previous level
- Level 9 - Same as level 8 but with 4 or 5 gravy stains added to the game screen
- Level 10 - The final level - Three side to side colonels but there should be 6

- It's important to note that tracking colonels should appear at random coordinates on the screen
- If Fergie touches or gets touched by a colonel, the game should end and a Game Over modal should appear with a message like 'Kentucky Fried Fergie!', 'Zingerrrr!', 'That's stopped Fergie's gravy train', 'Chef Fergie got cooked!' or 'Poor Fergie, the Colonel's whipping boy again!'. The users number of points should also be displayed

- If the user completes the game, it should show a modal with a message 'Congratulations, you helped Fergie save his secret sauce!' The max score of 1000 points should also be displayed

- Add a points scoring system, 100 points for completing each level. The game over / Completed screen
- A variation could be PACMAN

## Game 4: Escape the Colonel

**Route:** `/games/escape-the-colonel`

### Concept

A KFC-themed Frogger-style dodge game. Fergie's old days at KFC have come back to haunt him — the Colonel is hunting him down. The player drags Fergie from the bottom of the screen to the FINISH zone at the top while avoiding Colonel heads (some patrolling, some actively chasing) and gravy spills that slow him down. Ten levels of escalating difficulty, ending in a near-impossible final stage.

### Mechanics

#### Player Control

- Fergie is dragged via **Pointer Events** (`onPointerDown` on Fergie, `onPointerMove` to drag, `onPointerUp` to release).
- Fergie's position follows the pointer while held. On release, Fergie stops where he was last dragged.
- Fergie's **base speed is constant across all levels** — difficulty scales with colonels and gravy, not Fergie's movement.
- Fergie's position is clamped to the play area bounds.

#### Goal

- Reach the **FINISH zone** — a clearly marked horizontal band across the top of the screen (~10% of play area height) — to complete the level.
- Touching any colonel = game over.

#### Score

- **+100 points** for each level completed.
- Score is **hidden during play** — only revealed on the Game Over or Completed screen.
- Max possible score: **1000** (all 10 levels cleared).

#### Lives & Restart

- **No lives** — one hit and game over.
- Game over **restarts from Level 1**, score reset to 0.

### Level Progression

Between every level, show an **interstitial screen**:

- _"Level {n} Complete! +100 points"_
- A primary **"Continue"** button to start the next level.
- Once the player taps Continue, the next level begins immediately.

After Level 10 is completed, show the **Win Screen** instead (see "Game Over / Win" below).

### Levels

| Level | Patrolling Colonels        | Tracking Colonels                     | Gravy Stains |
| ----- | -------------------------- | ------------------------------------- | ------------ |
| 1     | 1 (slow)                   | 0                                     | 0            |
| 2     | 2 (slow)                   | 0                                     | 0            |
| 3     | 2 (slow)                   | 0                                     | 1            |
| 4     | 3 (slow)                   | 0                                     | 2            |
| 5     | 1 (slow)                   | 1 (slow, immediate)                   | 0            |
| 6     | 0                          | 2 (one immediate, one after 3s delay) | 0            |
| 7     | 2                          | 2 (one immediate, one after 3s delay) | 0            |
| 8     | 2 (50% faster than prev)   | 2 (50% faster than prev)              | 0            |
| 9     | 2 (50% faster, same as L8) | 2 (50% faster, same as L8)            | 4–5          |
| 10    | 3 (50% faster, same as L8) | 6 (one immediate, others staggered)   | 5            |

#### Patrolling Colonels (side-to-side)

- Move horizontally across the screen at a constant speed.
- When they hit the left or right edge of the play area, they reverse direction.
- Spawn at a random vertical position between **20% and 80%** of the play area height (avoid spawning in or near the FINISH zone or directly on Fergie's start position).
- Multiple patrolling colonels in the same level should spawn at **different vertical positions** — at least ~15% of play area height apart — to avoid stacking.

#### Tracking Colonels

- Move slowly toward Fergie's current position at a constant speed (slower than Fergie's drag speed by default — the player should always be able to outrun a single tracker).
- Spawn at a random position **at least 30% of the play area diagonal away from Fergie** to prevent unfair instant kills.
- Before a tracking colonel materialises, show a **flashing target marker** at the spawn coordinates for **500ms** as a warning, then the colonel appears and begins tracking.
- For staggered tracking colonels (e.g. "after 3s delay"), the 3-second timer starts when the level begins, then the warning marker plays, then the colonel appears.

#### Gravy Stains

- Spawn at random positions within the play area at the start of the level (avoid Fergie's start position and the FINISH zone — keep gravy in the middle ~70% vertically).
- **Permanent for the level** — they don't move or respawn.
- When Fergie touches a gravy stain:
  - His speed drops to **40% of normal for 1 second**, then returns to normal.
  - The gravy stain **disappears** (one-time use).
- Multiple gravy stains in a level should be spaced at least ~15% of the play area's smaller dimension apart so they don't cluster unfairly.

### Speed Reference Values

These are starting values to be tweaked during playtesting — define them as constants at the top of the page or in `lib/game-config.ts`:

```typescript
const FERGIE_SPEED = 1.0; // baseline (drag follows pointer; this is informational)
const PATROL_SPEED_BASE = 1.2; // % of play area width per second
const TRACKER_SPEED_BASE = 0.6; // % of play area diagonal per second
const SPEED_BOOST_FACTOR = 1.5; // applied from level 8 onwards
const GRAVY_SLOW_FACTOR = 0.4;
const GRAVY_SLOW_DURATION_MS = 1000;
const TRACKER_WARNING_MS = 500;
const TRACKER_MIN_SPAWN_DISTANCE = 0.3; // 30% of diagonal
```

### Collision Detection

- **Distance-based (circle overlap).** Treat Fergie and each colonel as circles.
- Pre-compute approximate radii from the rendered image sizes (e.g. `radius = imageWidth / 2 * 0.85` to give a slightly forgiving hitbox).
- On each animation frame, for each colonel: if `distance(fergie.center, colonel.center) < fergie.radius + colonel.radius`, trigger game over.
- Same logic for gravy stains, but with the gravy effect instead of game over.
- **Don't** check collision against the warning marker — only against the actual colonel once it has materialised.

### Game Over / Win

#### Game Over Modal

Triggered when Fergie collides with any colonel. Show `<GameOverScreen>` with:

- A randomly chosen message from:
  - _"Kentucky Fried Fergie!"_
  - _"Zingerrrr!"_
  - _"That's stopped Fergie's gravy train."_
  - _"Chef Fergie got cooked!"_
  - _"Poor Fergie, the Colonel's whipping boy again!"_
- The score: _"You scored {score} points."_
- Standard Play Again / Back to Menu buttons (Play Again restarts from Level 1).

#### Win Modal

Triggered when Fergie reaches FINISH on Level 10. Show `<GameOverScreen>` with:

- Message: _"Congratulations, you helped Fergie save his secret sauce!"_
- Score: _"You scored 1000 points."_
- Standard Play Again / Back to Menu buttons.

### Visual Design

- **Background:** the play area is a checkerboard of red (`#E11D2E`) and white squares. Use 8 columns × 12 rows or similar — should look like a picnic blanket / KFC tablecloth. Render with CSS (linear-gradient + repeating background or a grid of divs — your call, gradients are simpler).
- **FINISH zone:** a horizontal band across the top of the play area, ~10% tall. Solid red (`#8B0000`) with the word **"FINISH"** in large bold white display font, centred. A subtle pulsing glow effect to make it feel like a goal.
- **Fergie:** rendered from `/public/images/fergie/fergie-boxing.webp`, ~60×60px on mobile.
- **Colonels:** rendered from `/public/images/fergie/colonel.jpeg`, ~50×50px. Patrolling and tracking colonels look the same.
- **Gravy stains:** rendered from `/public/images/fergie/gravy.png`, ~70×70px, with slight transparency so the checkerboard shows through.
- **Tracker warning marker:** a flashing red circle (~50×50px) at the spawn position, animated with a CSS keyframe (e.g. `opacity: 0.3 → 1.0` at 8Hz) for 500ms before the colonel appears.
- All game entities use `position: absolute` inside the play area container, with positions stored as **percentages** (so layout works at any screen size).

### Asset Paths

```typescript
const ASSETS = {
  fergie: "/images/fergie/fergie-boxing.webp",
  colonel: "/images/fergie/colonel.jpeg",
  gravy: "/images/fergie/gravy.png",
};
```

These already exist in the repo. Use `next/image` where practical, but for game entities that need precise pixel positioning and frequent transform updates, plain `<img>` tags are fine and simpler.

### Technical Notes

- **Game loop:** use `requestAnimationFrame` for the main loop — update colonel positions, check collisions, render. Store entity state in a `useRef` (not `useState`) so updates inside the rAF loop don't trigger re-renders. Only `setState` to drive React-rendered changes (e.g. game over, level complete, gravy effect status).
- **Delta-time:** compute `deltaMs` between frames and scale movement by it, so speeds remain consistent regardless of frame rate.
- **Pointer events:** attach `onPointerMove` to the play area container, not just Fergie, so Fergie keeps following the pointer even if it briefly slips off his sprite during a fast drag.
- **Cleanup:** cancel `requestAnimationFrame` and clear all timers in the `useEffect` cleanup. Critical to avoid leaks when the user navigates away mid-game.
- **`touch-action: none`** on the play area to prevent scroll/zoom while dragging on mobile.
- **Prevent text selection** on the play area (`user-select: none`) so dragging doesn't accidentally highlight things.
- **Pause when tab inactive:** consider pausing the game loop when `document.hidden` is true, so a backgrounded game doesn't unfairly let trackers catch Fergie.
- **Restart cleanly:** when transitioning between levels or restarting from Level 1, fully reset entity state — don't carry over rAF handles or timers.
- Mark the page with `"use client"` at the top.

### State Shape

```typescript
type Phase = "playing" | "level-complete" | "game-over" | "won";
type ColonelKind = "patrol" | "tracker";

interface Colonel {
  id: string;
  kind: ColonelKind;
  x: number; // % of play area width
  y: number; // % of play area height
  vx?: number; // for patrol — current horizontal velocity
  active: boolean; // false during warning phase, true once materialised
  spawnDelayMs?: number; // for staggered trackers
}

interface Gravy {
  id: string;
  x: number;
  y: number;
}

interface FergieState {
  x: number;
  y: number;
  speedFactor: number; // 1.0 normally, 0.4 when sloweed by gravy
  isDragging: boolean;
}

interface GameState {
  level: number; // 1–10
  score: number;
  phase: Phase;
  fergie: FergieState;
  colonels: Colonel[];
  gravyStains: Gravy[];
  gameOverMessage?: string;
}
```

### Out of Scope for This Game

- No sound effects (sitewide policy — can be added later).
- No persistent best-level or leaderboard.
- No difficulty selection — the 10 levels are the difficulty curve.
- No animations on Fergie himself (running pose, etc.) — static sprite is fine.
