// app/regeln/page.tsx
"use client";

import { Clock, CheckCircle, Target, Video, } from "lucide-react";

export default function RegelnPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">📋 Regeln</h1>
          <p className="text-xl text-slate-400">
            MP Bankroll Cup - Offizielle Spielregeln
          </p>
        </div>

        {/* Main Rules */}
        <div className="space-y-8">
          {/* Bankroll Section */}
          <section className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700/50 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <Target className="text-blue-400 flex-shrink-0 mt-1" size={28} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">💰 Bankroll</h2>
                
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded p-4 border border-blue-600/30">
                    <p className="text-sm text-slate-400 mb-2">Startbankroll</p>
                    <p className="text-3xl font-bold text-blue-400">500 EUR</p>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4 border border-cyan-600/30">
                    <p className="text-sm text-slate-400 mb-2">Zielwert</p>
                    <p className="text-3xl font-bold text-cyan-400">5.000 EUR</p>
                    <p className="text-sm text-slate-400 mt-2">10x Multiplikator 🎯</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-950/50 rounded border border-blue-700/50">
                  <p className="text-slate-300">
                    ℹ️ Dein Ziel: Steigere deine Bankroll von <span className="font-bold text-blue-400">500 EUR</span> auf <span className="font-bold text-cyan-400">5.000 EUR</span> und werde ein erfolgreicher Poker-Player!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Updates Section */}
          <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <Clock className="text-purple-400 flex-shrink-0 mt-1" size={28} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">⏰ Bankroll Updates</h2>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded p-4 border border-purple-600/30">
                    <h3 className="font-bold text-purple-400 mb-2">Abgabefrist</h3>
                    <p className="text-lg">
                      Täglich bis <span className="font-bold text-pink-400">17:00 CET</span>
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4 border border-purple-600/30">
                    <h3 className="font-bold text-purple-400 mb-2">Was muss gemeldet werden?</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex gap-2">
                        <span className="text-purple-400">✓</span>
                        <span>Aktuelle Bankroll</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-400">✓</span>
                        <span>Bankrollscreenshot</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-400">✓</span>
                        <span>Kurze Notiz (optional)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-950/50 rounded border border-purple-700/50">
                    <p className="text-slate-300">
                      ℹ️ Updates, die nach 17:00 CET eingegeben werden, gelten als nächster Tag!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Verification Section */}
          <section className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-700/50 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <Video className="text-green-400 flex-shrink-0 mt-1" size={28} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">📹 Verifizierung</h2>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded p-4 border border-green-600/30">
                    <h3 className="font-bold text-green-400 mb-2">Regelmäßige Verifizierung</h3>
                    <p className="text-lg">
                      <span className="font-bold text-green-300">1x monatlich</span> via Bildschirmübertragung auf Discord
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4 border border-green-600/30">
                    <h3 className="font-bold text-green-400 mb-2">Zusätzliche Verifizierung</h3>
                    <p className="text-slate-300">
                      Jederzeit auf <span className="font-bold text-green-300">Aufforderung</span> der Admin/Mod möglich
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4 border border-green-600/30">
                    <h3 className="font-bold text-green-400 mb-2">Was wird überprüft?</h3>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex gap-2">
                        <span className="text-green-400">✓</span>
                        <span>GGPoker Account-Balanz</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Spielhistorie</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Genauigkeit der Meldungen</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-950/50 rounded border border-green-700/50">
                    <p className="text-slate-300">
                      ℹ️ Die Verifizierung dient der Transparenz und zum Schutz der Community!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-700/50 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-orange-400 flex-shrink-0 mt-1" size={28} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">⚠️ Wichtige Hinweise</h2>

                <div className="space-y-3 text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-orange-400 font-bold flex-shrink-0">1.</span>
                    <p>
                      Alle Bankroll-Updates müssen <span className="font-bold">korrekt und ehrlich</span> sein
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-orange-400 font-bold flex-shrink-0">2.</span>
                    <p>
                      Bei Verdacht auf Manipulation können <span className="font-bold">sofortige Verifizierungen</span> verlangt werden
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-orange-400 font-bold flex-shrink-0">3.</span>
                    <p>
                      Falsche Meldungen führen zu <span className="font-bold">Ausschluss</span> aus der Community
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-orange-400 font-bold flex-shrink-0">4.</span>
                    <p>
                      Du solltest <span className="font-bold">verantwortungsvoll</span> mit Poker umgehen
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-orange-400 font-bold flex-shrink-0">5.</span>
                    <p>
                      Die <span className="font-bold">Bankroll ist dein Kapital</span> - treat it with respect! 💪
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Success Criteria */}
          <section className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border border-yellow-700/50 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-yellow-400 flex-shrink-0 mt-1" size={28} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">🏆 Erfolgskriterien</h2>

                <div className="space-y-3 text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold flex-shrink-0">✓</span>
                    <p>
                      Du erreichst dein Ziel von <span className="font-bold text-yellow-300">5.000 EUR</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold flex-shrink-0">✓</span>
                    <p>
                      Du machst täglich <span className="font-bold">ehrliche Updates</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold flex-shrink-0">✓</span>
                    <p>
                      Du unterstützt die <span className="font-bold">Community</span> und teilst deine Erfahrungen
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-yellow-400 font-bold flex-shrink-0">✓</span>
                    <p>
                      Du bestehst alle <span className="font-bold">Verifizierungen</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-950/50 rounded border border-yellow-700/50">
                  <p className="text-slate-300">
                    🎉 Dann bist du Teil der erfolgreichsten Bankroll-Challenge und verdienst dir den Titel eines echten Poker-Professionals!
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <p className="text-slate-400 mb-4">
              Haben Sie Fragen zu den Regeln?
            </p>
            <p className="text-slate-300">
              Kontaktiere uns über unseren{' '}
              <a 
                href="https://discord.gg/YbeKE6YEa8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition"
              >
                Discord Server
              </a>
              {' '}💬
            </p>