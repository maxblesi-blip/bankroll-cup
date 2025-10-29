"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare, AlertCircle, Zap } from "lucide-react";

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Wie melde ich mich zum Cup an?",
      answer:
        "Geh auf die Anmeldung Seite, meld dich mit Discord an und füll das Formular aus. Nach der Überprüfung erhältst du Zugriff auf alle Features.",
    },
    {
      question: "Wie oft muss ich meine Bankroll updaten?",
      answer:
        "Du solltest deine Bankroll täglich bis 17:00 CET updaten. Updates nach dieser Zeit werden als nächster Tag gezählt.",
    },
    {
      question: "Was passiert wenn ich nicht mehr spielen kann?",
      answer:
        "Kontaktiere einen Mod über das Ticketsystem. Wir können dich temporär deaktivieren oder deine Teilnahme beenden.",
    },
    {
      question: "Kann ich Screenshots nachreichen?",
      answer:
        "Ja, du kannst über das Ticketsystem mit uns chatten und Screenshots hochladen. Mods und Admins überprüfen diese dann.",
    },
    {
      question: "Wie lange dauert die monatliche Verifizierung?",
      answer:
        "Die Verifizierung dauert normalerweise 10-15 Minuten. Wir machen einen Screen Share über Discord.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <HelpCircle size={48} className="text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold mb-4">💬 Hilfe & Support</h1>
          <p className="text-xl text-slate-400 mb-8">
            Hast du Fragen? Wir helfen dir gerne weiter!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help/tickets"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center justify-center gap-2"
            >
              📋 Meine Tickets
            </Link>
            <Link
              href="/help/create-ticket"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center justify-center gap-2"
            >
              ➕ Neues Ticket
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold text-lg mb-2">Fragen?</h3>
            <p className="text-slate-400 text-sm">
              Erstelle ein Ticket und chatte mit unserem Support Team
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">🐛</div>
            <h3 className="font-bold text-lg mb-2">Bug Report</h3>
            <p className="text-slate-400 text-sm">
              Hast du einen Bug gefunden? Melde ihn über das Ticketsystem
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-bold text-lg mb-2">Feedback</h3>
            <p className="text-slate-400 text-sm">
              Hast du Verbesserungsvorschläge? Wir freuen uns auf dein Feedback
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">❓ Häufig gestellte Fragen</h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left px-6 py-4 hover:bg-slate-700 transition flex items-center justify-between font-bold"
                >
                  <span>{faq.question}</span>
                  <span className="text-purple-400">
                    {expandedFaq === index ? "−" : "+"}
                  </span>
                </button>

                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 text-slate-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
            <div className="flex gap-3">
              <MessageSquare className="text-blue-400 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold mb-2">💬 Response Zeit</h3>
                <p className="text-slate-300 text-sm">
                  Wir antworten normalerweise innerhalb von 24 Stunden auf Tickets.
                  Bei dringenden Angelegenheiten kontaktiere uns auf Discord.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
            <div className="flex gap-3">
              <AlertCircle className="text-green-400 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold mb-2">⚡ Dringende Probleme</h3>
                <p className="text-slate-300 text-sm">
                  Bei Notfällen (z.B. Account-Probleme) schreib auf Discord
                  @Mods für schnellere Hilfe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Link */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">🎮 Brauchst du sofort Hilfe?</h3>
            <p className="text-slate-300 mb-6">
              Tritt unserem Discord Server bei und sprich direkt mit Mods und Admins
            </p>
            <a
              href="https://discord.gg/YbeKE6YEa8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              💬 Zum Discord Server
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
