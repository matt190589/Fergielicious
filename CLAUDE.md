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
