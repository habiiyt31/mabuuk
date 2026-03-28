import type { Metadata } from "next";
import { WalletProvider } from "@/lib/wallet-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mabuuk",
  description: "Don't let drunk-you ruin sober-you's portfolio. AI sobriety verification on GenLayer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  );
}
