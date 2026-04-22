interface TimerProps {
  seconds: number;
}

export default function Timer({ seconds }: TimerProps) {
  const isLow = seconds <= 10;
  return (
    <div
      className={`font-display text-5xl tracking-wide tabular-nums ${
        isLow ? "text-red-primary animate-pulse" : "text-gray-800"
      }`}
    >
      {seconds}s
    </div>
  );
}
