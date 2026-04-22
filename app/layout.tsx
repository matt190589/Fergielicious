import type { Metadata } from "next";
import { Bangers, Fredoka } from "next/font/google";
import "./globals.css";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

const fredoka = Fredoka({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Fergielicious",
  description: "Three mini-games in honour of the legend himself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${fredoka.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream font-body">
        {children}
      </body>
    </html>
  );
}
