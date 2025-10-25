"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, Loader } from "lucide-react";

interface PlayerData {
  email: string;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
}

export default function BankrollUpdatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [formData, setFormData] = useState({
    bankroll: "",
    notes: "",
  });

  // Überprüfe ob User authentifiziert ist
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // ✅ Lade Spielerdaten aus Leaderboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      loadPlayerData();
    }
  }, [status, session]);

  const loadPlayerData = async () => {
    try {
      setLoadingPlayer(true);
      const user = session?.user as any;
      const userEmail = user?.discordEmail || user?.email;

      if (!userEmail) {
        setError("Email konnte nicht ermittelt werden!");
        setLoadingPlayer(false);
        return;
      }

      console.log(`🔍 [PLAYER] Lade Spielerdaten für: ${userEmail}`);

      // Lade Spieler aus Leaderboard
      const response = await fetch("/api/leaderboard");
      const leaderboardData = await response.json();

      if (!leaderboardData.players || !Array.isArray(leaderboardData.players)) {
        console.warn("⚠️  Keine Spielerdaten im Leaderboard");
        setLoadingPlayer(false);
        return;
      }

      // Suche Spieler mit dieser Email
      const player = leaderboardData.players.find(
        (p: any) => p.email?.toLowerCase() === userEmail.toLowerCase()
      );

      if (player) {
        console.log(`✅ [PLAYER] Spielerdaten gefunden:`);
        console.log(`   Name: ${player.name}`);
        console.log(`   Email: ${player.email}`);
        console.log(`   GGPoker: ${player.ggpokerNickname}`);
        console.log(`   Bankroll: €${player.bankroll}`);

        setPlayerData({
          email: player.email,
          name: player.name,
          ggpokerNickname: player.ggpokerNickname,
          bankroll: parseFloat(player.bankroll) || 0,
        });

        // Setze aktuelle Bankroll als Default
        setFormData((prev) => ({
          ...prev,
          bankroll: player.bankroll?.toString() || "",
        }));
      } else {
        console.warn(`⚠️  [PLAYER] Spieler ${userEmail} nicht im Leaderboard gefunden`);
        console.log(`   Verfügbare Emails:`, leaderboardData.players.map((p: any) => p.email));
      }
    } catch (error) {
      console.error("❌ Error loading player data:", error);
      setError("Fehler beim Laden der Spielerdaten!");
    } finally {
      setLoadingPlayer(false);
    }
  };

  if (status === "loading" || loadingPlayer) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-purple-400" />
          <p className="text-slate-300">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validierung
      if (!formData.bankroll) {
        setError("Bitte geben Sie die aktuelle Bankroll ein!");
        setLoading(false);
        return;
      }

      const bankrollValue = parseFloat(formData.bankroll);
      if (isNaN(bankrollValue) || bankrollValue < 0) {
        setError("Bitte geben Sie einen gültigen Wert ein!");
        setLoading(false);
        return;
      }

      // ✅ Nutze Spielerdaten aus Leaderboard!
      if (!playerData) {
        setError("Spielerdaten nicht verfügbar!");
        setLoading(false);
        return;
      }

      console.log(`📤 [SUBMIT] Bankroll Update:`);
      console.log(`   Email: ${playerData.email}`);
      console.log(`   Name: ${playerData.name}`);
      console.log(`   Bankroll: €${bankrollValue}`);

      // Sende Update mit Spielerdaten aus Leaderboard
      const response = await fetch("/api/bankroll-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: playerData.email, // ✅ Aus Leaderboard!
          userName: playerData.name, // ✅ Aus Leaderboard!
          bankroll: bankrollValue,
          notes: formData.notes,
          createdAt: new Date().toISOString(),
          status: "pending",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [SUCCESS] Update eingereicht mit ID: ${data.id}`);

        setSuccess(
          `✅ Bankroll-Update erfolgreich eingereicht! Die Admins werden dich bald überprüfen.`
        );

        // Reset Form
        setFormData({
          bankroll: playerData.bankroll?.toString() || "",
          notes: "",
        });

        // Nach 2 Sekunden zur Ranking Seite gehen
        setTimeout(() => {
          router.push("/ranking");
        }, 2000);
      } else {
        const data = await response.json();
        console.error(`❌ [ERROR] API Error:`, data);
        setError(data.error || "Fehler beim Speichern!");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Fehler beim Speichern! Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">💰 Bankroll Update</h1>
        <p className="text-slate-400 mb-8">
          Melde deine aktuelle Bankroll täglich bis 17:00 Uhr
        </p>

        {/* User Info */}
        {playerData ? (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-slate-400">Angemeldet als</p>
            <p className="font-bold text-green-400">{playerData.name}</p>
            <p className="text-xs text-slate-500 mt-1">Email: {playerData.email}</p>
            {playerData.ggpokerNickname && (
              <p className="text-xs text-slate-500">
                GGPoker: {playerData.ggpokerNickname}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Aktuelle Bankroll im System: <span className="font-bold text-green-400">€{playerData.bankroll}</span>
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-300">
              ⚠️ Du bist noch nicht im Leaderboard registriert. Bitte wende dich an einen Admin!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-red-400">Fehler</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6 flex gap-3">
            <div>
              <p className="font-bold text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6"
          disabled={!playerData}
        >
          {/* Current Bankroll */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Aktuelle Bankroll * (EUR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">
                €
              </span>
              <input
                type="number"
                name="bankroll"
                value={formData.bankroll}
                onChange={handleChange}
                step="0.01"
                min="0"
                disabled={!playerData}
                className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 pl-8 text-white focus:border-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="z.B. 550.50"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Geben Sie Ihre aktuelle Bankroll-Balance ein
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Notizen (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={!playerData}
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-white focus:border-purple-500 outline-none resize-none h-24 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="z.B. Guter Tag, 3 Stunden gespielt, +50€"
            />
            <p className="text-xs text-slate-400 mt-2">
              Kurze Notiz über deinen Tag (z.B. Gewinn/Verlust, Spielstunden, etc.)
            </p>
          </div>

          {/* Deadline Info */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              ⏰ <span className="font-bold">Wichtig:</span> Updates müssen täglich bis{" "}
              <span className="font-bold text-blue-200">17:00 Uhr</span> eingegeben
              werden!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !playerData}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? "Wird gespeichert..." : "✅ Update einreichen"}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="font-bold mb-3 text-purple-400">📋 Ablauf</h3>
          <ol className="space-y-2 text-sm text-slate-300">
            <li>
              <span className="font-bold text-purple-400">1.</span> Geben Sie Ihre
              aktuelle Bankroll ein
            </li>
            <li>
              <span className="font-bold text-purple-400">2.</span> Die Admins
              überprüfen Ihr Update
            </li>
            <li>
              <span className="font-bold text-purple-400">3.</span> Einmal im Monat
              wird eine Verifizierung via Discord durchgeführt
            </li>
            <li>
              <span className="font-bold text-purple-400">4.</span> Dein Fortschritt
              wird in der Rangliste angezeigt
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}