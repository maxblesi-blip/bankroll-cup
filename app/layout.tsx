import type { Metadata } from "next";
import Providers from "./providers";
import NavigationWrapper from "./components/NavigationWrapper.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: " MP Bankroll Cup",
  description: "Poker Bankroll Cup",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>♠️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-slate-950 text-white" suppressHydrationWarning>
        <Providers>
          <NavigationWrapper />
          <main className="min-h-screen pt-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}