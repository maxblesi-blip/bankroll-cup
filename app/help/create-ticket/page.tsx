"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CreateTicketPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "question",
    priority: "medium",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!session?.user) {
        setError("Bitte melde dich an");
        setLoading(false);
        return;
      }

      if (!formData.title.trim()) {
        setError("Titel ist erforderlich");
        setLoading(false);
        return;
      }

      if (!formData.message.trim()) {
        setError("Nachricht ist erforderlich");
        setLoading(false);
        return;
      }

      const user = session.user as any;

      // 1. Erstelle Ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert([
          {
            user_id: user.id,
            user_email: user.email,
            user_name: user.name,
            title: formData.title,
            category: formData.category,
            priority: formData.priority,
            status: "open",
          },
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Poste erste Nachricht
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert([
          {
            ticket_id: ticket.id,
            user_id: user.id,
            user_name: user.name,
            user_role: "user",
            message: formData.message,
          },
        ]);

      if (messageError) throw messageError;

      setSuccess(true);
      setTicketId(ticket.id);
      setFormData({
        title: "",
        category: "question",
        priority: "medium",
        message: "",
      });

      setTimeout(() => {
        router.push(`/help/ticket/${ticket.id}`);
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-400 font-bold mb-4">Bitte melde dich an um ein Ticket zu erstellen</p>
          <Link href="/signin" className="text-blue-400 hover:underline">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-8 text-center">
          <div className="inline-block mb-4">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">✅ Ticket erstellt!</h2>
          <p className="text-slate-300 mb-6">
            Dein Ticket wurde erfolgreich erstellt. Du wirst automatisch weitergeleitet...
          </p>
          <Link
            href={`/help/ticket/${ticketId}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Zum Ticket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">➕ Neues Ticket erstellen</h1>
        <p className="text-slate-400">Beschreib dein Problem und wir helfen dir</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2">Titel *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="z.B. Bankroll Update funktioniert nicht"
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 outline-none"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Kurze Beschreibung deines Problems</p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Kategorie *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
          >
            <option value="question">❓ Frage</option>
            <option value="bug">🐛 Bug Report</option>
            <option value="feature">💡 Feature Request</option>
            <option value="other">📌 Sonstiges</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Priorität</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
          >
            <option value="low">➡️ Niedrig</option>
            <option value="medium">📌 Mittel</option>
            <option value="high">⚠️ Hoch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Nachricht *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Beschreib dein Problem im Detail..."
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 outline-none resize-none"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Je detaillierter, desto besser können wir dir helfen</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Wird erstellt...
            </>
          ) : (
            "✅ Ticket erstellen"
          )}
        </button>
      </form>

      <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="font-bold mb-2">💡 Tipps für bessere Hilfe:</h3>
        <ul className="text-slate-300 text-sm space-y-2">
          <li>✅ Sei so spezifisch wie möglich</li>
          <li>✅ Erwähne alle fehlermeldungen</li>
          <li>✅ Du kannst später Screenshots hochladen</li>
          <li>✅ Wir antworten normalerweise in 24 Stunden</li>
        </ul>
      </div>
    </div>
  );
}