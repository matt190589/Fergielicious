import Link from "next/link";

const games = [
  {
    emoji: "🍆",
    title: "Pin the Willy on Fergie",
    teaser: "Help Fergie find his wee Willy!",
    href: "/games/pin-the-willy",
  },
  {
    emoji: "🍷",
    title: "Buck Fergie",
    teaser: "Feed Fergie as much Buckfast as possible in 20 seconds.",
    href: "/games/buck-fergie",
  },
  {
    emoji: "🥊",
    title: "Fergie Fight",
    teaser: "Whack Fergie before he ducks away.",
    href: "/games/fergie-fight",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-8 sm:py-12 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-[clamp(2.8rem,13vw,5rem)] text-red-primary tracking-wide leading-none">
            Fergielicious
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-700 font-body leading-snug">
            Three mini-games in honour of the legend himself.{" "}
            <span className="font-semibold">Pick your poison.</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="flex items-center gap-5 rounded-2xl bg-red-primary text-white p-5 shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-5xl shrink-0">{game.emoji}</span>
              <div>
                <p className="font-display text-2xl tracking-wide leading-tight">
                  {game.title}
                </p>
                <p className="text-sm opacity-90 mt-1 font-body leading-snug">
                  {game.teaser}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
