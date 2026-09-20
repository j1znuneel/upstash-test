import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upstash All-in-One Showcase | Next.js on Vercel",
  description:
    "Learn Redis, Vector, and QStash with an interactive Next.js App Router full-stack application.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0B0F17] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

