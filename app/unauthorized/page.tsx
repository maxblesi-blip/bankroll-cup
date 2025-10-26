"use client";

import { ChevronRight, Trophy, Users, TrendingUp, Zap, Calendar } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎯 MP Bankroll Cup
          </h1>
          <p className="text-3xl text-slate-300 font-bold mb-2">Season 1</p>
          <div className="inline-block bg-yellow-900/30 border border-yellow-700 rounded-full px-4 py-2 mb-4">
            <p className="text-yellow-300 font-bold">🚀 Startet Anfang 2026</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Start Info */}
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700/50 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-400 mb-4">🚀 Start</h2>
              <p className="text-slate-400 text-sm mb-2">Startkapital</p>
              <p className="text-4xl font-bold text-cyan-400">500 EUR</p>
              <p className="text-xs text-slate-400 mt-3">Dein Anfangsbudget für den Cup</p>
            </div>
          </div>

          {/* Goal Info */}
          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-700/50 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-green-400 mb-4">🏆 Ziel</h2>
              <p className="text-slate-400 text-sm mb-2">Zielwert</p>
              <p className="text-4xl font-bold text-emerald-400">5.000 EUR</p>
              <p className="text-xs text-slate-400 mt-3">(10x Multiplikator)</p>
            </div>
          </div>
        </div>

        {/* Cup Details */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">📋 Rahmenbedingungen</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-bold text-purple-400 mb-2">📅 Start</h3>
              <p className="text-slate-300">Anfang 2026</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-blue-400 mb-2">💰 Startbankroll</h3>
              <p className="text-slate-300">500 EUR</p>
              <p className="text-xs text-slate-400 mt-1">Minimales Startkapital für jeden Teilnehmer</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-green-400 mb-2">🎯 Zielwert</h3>
              <p className="text-slate-300">5.000 EUR</p>
              <p className="text-xs text-slate-400 mt-1">10x Multiplikator - Das ist dein Erfolgs-Ziel!</p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-bold text-yellow-400 mb-2">🎮 Poker-Plattform</h3>
              <p className="text-slate-300">GGPoker</p>
              <p className="text-xs text-slate-400 mt-1">Der offizielle Poker-Room für den Cup</p>
            </div>

            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="font-bold text-pink-400 mb-2">📊 Tägliche Updates</h3>
              <p className="text-slate-300">Bis 17:00 CET</p>
              <p className="text-xs text-slate-400 mt-1">Bankroll-Updates müssen täglich eingereicht werden</p>
            </div>

            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-bold text-indigo-400 mb-2">✅ Monatliche Verifizierung</h3>
              <p className="text-slate-300">1x pro Monat via Discord</p>
              <p className="text-xs text-slate-400 mt-1">Transparenz durch regelmäßige Kontrollen</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Echtzeit-Rangliste</h3>
            <p className="text-sm text-slate-400">Verfolge deinen Fortschritt und vergleiche dich mit anderen Spielern</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <Users className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Community</h3>
            <p className="text-sm text-slate-400">Werde Teil einer motivierten Poker-Community mit gemeinsamen Zielen</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <Zap className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Verifiziert & Sicher</h3>
            <p className="text-sm text-slate-400">Monatliche Verifizierungen und Transparenz für Glaubwürdigkeit</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">🗓️ Ablauf</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-purple-400">Anfang 2026 - Cup startet</h3>
                <p className="text-sm text-slate-300">Der 1. MP Bankroll Cup startet offiziell</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-purple-400">Täglich - Updates einreichen</h3>
                <p className="text-sm text-slate-300">Teile deine Bankroll-Fortschritte täglich bis 17:00 CET mit Screenshots</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-purple-400">Monatlich - Verifizierung</h3>
                <p className="text-sm text-slate-300">Deine Bankroll wird monatlich via Discord verifiziert</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 flex-shrink-0">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-purple-400">Laufend - Rangliste verfolgbar</h3>
                <p className="text-sm text-slate-300">Dein Fortschritt wird in Echtzeit auf der Rangliste angezeigt</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600 flex-shrink-0">
                <span className="text-white font-bold text-sm">5</span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-green-400">Zielwert erreicht - Du gewinnst!</h3>
                <p className="text-sm text-slate-300">Der erste Spieler mit 5.000€ gewinnt den MP Bankroll Cup 🏆</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg p-8 text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">🎮 Willst du teilnehmen?</h2>

          <p className="text-slate-300 mb-8 text-lg">
            Tritt unserem Discord bei für mehr Informationen und um Zugriff auf den Bankroll Cup zu erhalten!
          </p>

          <a
            href="https://discord.gg/YbeKE6YEa8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg transition text-lg"
          >
            💬 Zum Discord beitreten
            <ChevronRight size={20} />
          </a>

          <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">
              Du erhältst Zugriff auf alle Features und den Bankroll-Update Editor, sobald du dem Discord beigetreten bist und die erforderliche Rolle erhältst!
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h3 className="font-bold text-lg mb-4">❓ Hast du Fragen?</h3>
          <p className="text-slate-300 mb-4">
            Schreib uns im Discord oder schau dir die Regeln an für mehr Details!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://discord.gg/YbeKE6YEa8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition text-center"
            >
              💬 Discord Server
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}