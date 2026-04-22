import Link from "next/link";

interface GameLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function GameLayout({ title, children }: GameLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="flex items-center gap-3 px-4 py-3 bg-red-primary text-white shadow-md">
        <Link
          href="/"
          className="text-sm font-body font-medium hover:underline whitespace-nowrap shrink-0"
        >
          ← Back to Menu
        </Link>
        <h1 className="font-display text-2xl tracking-wide leading-none truncate">
          {title}
        </h1>
      </header>
      <main className="flex flex-col flex-1">{children}</main>
    </div>
  );
}
