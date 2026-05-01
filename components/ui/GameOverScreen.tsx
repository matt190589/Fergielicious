import Button from "./Button";

interface GameOverScreenProps {
  score: number | string;
  message: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export default function GameOverScreen({
  score,
  message,
  onPlayAgain,
  onBackToMenu,
}: GameOverScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center gap-5">
      <div className="bg-red-primary text-white rounded-3xl px-5 py-6 sm:px-8 sm:py-8 shadow-xl w-full max-w-sm">
        <p className="font-display text-4xl sm:text-5xl tracking-wide">Game Over!</p>
        <p className="text-lg sm:text-2xl font-body font-semibold mt-3">{score}</p>
        <p className="text-sm sm:text-base font-body mt-3 opacity-90 leading-snug">{message}</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button variant="primary" onClick={onPlayAgain} className="w-full">
          Play Again
        </Button>
        <Button variant="secondary" onClick={onBackToMenu} className="w-full">
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
