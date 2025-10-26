"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, Users, TrendingUp, Zap, Loader } from "lucide-react";
import { DISCORD_ROLES } from "@/lib/constants";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // ✅ ZUGRIFFS-CHECK - Role basiert
  useEffect(() => {
    if (status === "loading") return;

    // Nicht eingeloggt → /unauthorized
    if (!session?.user) {
      router.push("/unauthorized");
      return;
    }

    // Role checken
    const user = session.user as any;
    const userRoles = user.roles || [];
    const hasRole = userRoles.includes(DISCORD_ROLES.BANKROLL_CUP_PARTICIPANT);

    if (!hasRole) {
      // Keine Role → /unauthorized
      router.push("/unauthorized");
      return;
    }

    // Alles OK
    setIsAuthorized(true);
  }, [session, status, router]);

  // ✅ LOADING STATE - Während Authorization überprüft wird
  if (isAuthorized === null || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader size={40} className="animate-spin text-purple-400" />
          <p className="text-slate-300">Wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <Trophy className="w-20 h-20 text-yellow-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            MP Bankroll Cup
          </h1>
          <p className="text-2xl text-slate-300 mb-8">
            1. Auflage
          </p>
        </div>

        {/* Main Info */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-600 rounded-2xl p-12 mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Das Ziel</h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Starte mit 500€ Bankroll und versuche diese so schnell wie
                möglich auf 5.000€ zu bringen.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                Der erste Spieler der sein Ziel erreicht gewinnt den MP
                Bankroll Cup und wird in die Hall of Fame aufgenommen!
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-700 rounded-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-400 text-slate-950 rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    $
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Startbankroll</p>
                    <p className="text-2xl font-bold">500€</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Ziel</p>
                    <p className="text-2xl font-bold">5.000€</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    10x
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Multiplikator</p>
                    <p className="text-2xl font-bold">10x ROI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <TrendingUp className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Live Tracking</h3>
            <p className="text-slate-300">
              Verfolge deine Bankroll in Echtzeit auf der Rangliste.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <Users className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Community</h3>
            <p className="text-slate-300">
              Tausch dich mit anderen Spielern aus und verfolge ihren
              Fortschritt.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <Zap className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Wöchentliche Verifikation</h3>
            <p className="text-slate-300">
              Bankrolls werden wöchentlich von Mods verifiziert.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center mb-20">
          <h2 className="text-3xl font-bold mb-4">Bereit zum Spielen?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Melde dich jetzt an und starte deine Challenge!
          </p>
          <Link
            href="/anmeldung"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-100 transition transform hover:scale-105"
          >
            Jetzt Anmelden
          </Link>
        </div>

        {/* Rules */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Regeln</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Allgemein</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Start mit 500€ Bankroll</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Ziel: 5.000€ erreichen</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Nur GGPoker als Poker Room</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">
                Verifikation
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Wöchentliche Überprüfung</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Screenshots erforderlich</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400">✓</span>
                  <span>Transparenz ist Pflicht</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}