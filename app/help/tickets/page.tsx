"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchTickets = async () => {
      try {
        const user = session.user as any;
        const { data, error: dbError } = await supabase
          .from("tickets")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        setTickets(data || []);
      } catch (err) {
        console.error("Error loading tickets:", err);
        setError("Fehler beim Laden der Tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [session]);

  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-400 font-bold">Bitte melde dich an um deine Tickets zu sehen</p>
          <Link href="/signin" className="text-blue-400 hover:underline mt-2 block">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-purple-400" />
          <p className="text-slate-300">Tickets werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">📋 Meine Tickets</h1>
          <p className="text-slate-400">Du hast {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/help/create-ticket"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Neues Ticket
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={24} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-16 text-center">
          <p className="text-slate-300 text-xl font-bold mb-4">Keine Tickets vorhanden</p>
          <p className="text-slate-400 mb-6">Du hast noch keine Tickets erstellt</p>
          <Link
            href="/help/create-ticket"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            ➕ Erstes Ticket erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/help/ticket/${ticket.id}`}
              className="block bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{ticket.title}</h3>
                  <p className="text-sm text-slate-400">#{ticket.id.substring(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      ticket.status === "open"
                        ? "bg-blue-900/30 text-blue-400"
                        : ticket.status === "in_progress"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : ticket.status === "resolved"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {ticket.status === "open" && "🟢 Offen"}
                    {ticket.status === "in_progress" && "🟡 In Bearbeitung"}
                    {ticket.status === "resolved" && "✅ Gelöst"}
                    {ticket.status === "closed" && "🔴 Geschlossen"}
                  </span>

                  <span
                    className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      ticket.priority === "high"
                        ? "bg-red-900/30 text-red-400"
                        : ticket.priority === "medium"
                        ? "bg-orange-900/30 text-orange-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {ticket.priority === "high" && "⚠️ Hoch"}
                    {ticket.priority === "medium" && "📌 Mittel"}
                    {ticket.priority === "low" && "➡️ Niedrig"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-400">
                <span>Kategorie: {ticket.category || "Sonstige"}</span>
                <span>{new Date(ticket.created_at).toLocaleDateString("de-DE")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}