import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upstash Engine | Serverless Knowledge & Task Architecture",
  description:
    "Production-grade Next.js App Router architecture combining Upstash Redis, Upstash Vector, and Upstash QStash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#09090b]">
      <body className="antialiased min-h-screen bg-[#09090b] text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
