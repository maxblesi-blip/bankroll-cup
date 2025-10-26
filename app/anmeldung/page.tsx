// app/anmeldung/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface RegistrationData {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function AnmeldungPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [isDiscordMember, setIsDiscordMember] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // ✅ SUCCESS State
  const [successData, setSuccessData] = useState<RegistrationData | null>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "", // ✅ Wird mit Discord Email vorgefüllt (nicht änderbar)
    ggpokerNickname: "",
    discord: "",
    livestreamLink: "",
  });

  // Extrahiere Discord User ID aus der Session
  const getDiscordUserId = () => {
    if (!session?.user) return null;
    const user = session.user as any;
    
    // Versuche verschiedene mögliche Pfade
    const userId = 
      user.id ||                    // NextAuth Default
      user.image?.split("/")[4] ||  // Aus Discord Avatar URL extrahieren
      user.discord_id ||             // Alternative Property
      user.provider_id;              // Manche Setups
    
    console.log("Session user object:", user);
    console.log("Extracted Discord User ID:", userId);
    
    return userId;
  };

  // Überprüfe ob User auf Discord Server ist
  const checkDiscordMembership = async () => {
    try {
      setCheckingMembership(true);
      setDebugInfo("");
      
      const discordUserId = getDiscordUserId();
      
      if (!discordUserId) {
        setDebugInfo(
          "❌ Discord User ID konnte nicht extrahiert werden. Session: " +
          JSON.stringify(session?.user, null, 2)
        );
        setIsDiscordMember(false);
        return;
      }

      console.log(`Checking membership for user: ${discordUserId}`);
      setDebugInfo(`Überprüfe User: ${discordUserId}`);

      const response = await fetch("/api/check-discord-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordUserId: discordUserId,
        }),
      });

      const data = await response.json();
      
      console.log("Membership check response:", data);
      
      if (response.ok && data.isMember) {
        setIsDiscordMember(true);
        setDebugInfo(`✅ Mitglied bestätigt: ${data.nickname || "User"}`);
      } else {
        setIsDiscordMember(false);
        setDebugInfo(data.message || "Nicht auf dem Server");
      }
    } catch (error) {
      console.error("Error checking Discord membership:", error);
      setDebugInfo(`❌ Fehler: ${error instanceof Error ? error.message : "Unbekannt"}`);
      setIsDiscordMember(false);
    } finally {
      setCheckingMembership(false);
    }
  };

  // ✅ Prüfe ob Registrierung im Sheet vorhanden ist
  const checkRegistrationStatus = async (userEmail: string) => {
    try {
      setCheckingRegistration(true);
      console.log(`🔍 Prüfe Registrierung für: ${userEmail}`);

      const response = await fetch("/api/leaderboard"); // Oder eine neue API Route
      const data = await response.json();

      if (!data.players || !Array.isArray(data.players)) {
        console.warn("❌ Keine Spielerdaten gefunden");
        return;
      }

      // Hier prüfen wir im Leaderboard - für besseres Ergebnis könntest du
      // eine separate Route erstellen die auf "Registrierungen" prüft
      const player = data.players.find(
        (p: any) => p.email?.toLowerCase() === userEmail.toLowerCase()
      );

      if (player) {
        console.log(`✅ Spieler gefunden:`, player);
        setSuccessData({
          id: player.id,
          name: player.name,
          email: player.email,
          status: "processing",
        });
      } else {
        console.log(`ℹ️  Spieler noch nicht im System`);
        setSuccessData({
          id: Date.now().toString(),
          name: formData.name,
          email: userEmail,
          status: "pending",
        });
      }
    } catch (error) {
      console.error("❌ Error checking registration:", error);
      setSuccessData({
        id: Date.now().toString(),
        name: formData.name,
        email: userEmail,
        status: "pending",
      });
    } finally {
      setCheckingRegistration(false);
    }
  };

  // Initialer Check wenn Session vorhanden
  useEffect(() => {
    if (session?.user && status === "authenticated") {
      const user = session.user as any;
      
      // ✅ Nutze discordEmail von der Session
      const emailFromDiscord = user.discordEmail || user.email || "";
      
      console.log(`📧 Discord Email geladen:`, emailFromDiscord);
      
      setFormData((prev) => ({
        ...prev,
        name: prev.name, // User muss Name selbst eingeben
        discord: user.discordUsername || user.name || user.discord || "", // Discord Username
        email: emailFromDiscord, // ✅ Discord Email (nicht änderbar!)
        livestreamLink: prev.livestreamLink || user.livestreamLink || user.bio || "",
      }));
      
      // Automatisch Membership prüfen
      checkDiscordMembership();
    }
  }, [session, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.ggpokerNickname ||
        !formData.discord
      ) {
        alert("Bitte fülle alle Pflichtfelder aus!");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email, // ✅ Discord Email (nicht geändert)
          ggpokerNickname: formData.ggpokerNickname,
          discord: formData.discord,
          livestreamLink: formData.livestreamLink,
          bankroll: 0,
          experience: "beginner",
          createdAt: new Date().toISOString(),
          status: "pending",
        }),
      });

      if (response.ok) {
        console.log("✅ Registrierung erfolgreich eingereicht!");
        
        // ✅ Statt redirect, prüfe Registrierung und zeige Success Screen
        await checkRegistrationStatus(formData.email);
      } else {
        alert("❌ Fehler beim Speichern!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Fehler beim Speichern!");
    } finally {
      setLoading(false);
    }
  };

  // Zeige Loading während Session geladen wird
  if (status === "loading" || (session && checkingMembership)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-slate-400">Wird geladen...</p>
      </div>
    );
  }

  // ✅ SUCCESS SCREEN - nach erfolgreicher Anmeldung
  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🎉 Bewerbung eingereicht!</h1>
        <p className="text-slate-400 mb-8">Danke für dein Interesse!</p>

        {/* Success Message */}
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-green-400 mb-3">
                ✅ Bewerbung erfolgreich eingereicht
              </h2>
              <p className="text-slate-200">
                Hallo <span className="font-bold">{successData.name}</span>,
              </p>
              <p className="text-slate-300 mt-2">
                deine Bewerbung wird jetzt von unserem Admin-Team bearbeitet. Bitte habe etwas Geduld - wir überprüfen alle Daten sorgfältig!
              </p>
            </div>
          </div>
        </div>

        {/* Bewerbungs-Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8 space-y-6">
          <div>
            <h3 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
              📋 Deine Bewerbungsdaten
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-bold">{successData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-bold">{successData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-yellow-400 font-bold">⏳ In Bearbeitung...</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
              💬 Bei Fragen?
            </h3>
            <div className="bg-slate-900 border border-slate-700 rounded p-4">
              <p className="text-slate-300 text-sm mb-2">
                Kontaktiere uns auf Discord:
              </p>
              <p className="text-lg font-bold text-purple-400">
                👤 Max Powker
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Wir helfen dir gerne weiter bei Fragen oder Problemen!
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h3 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
            ⏱️ Was kommt danach?
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  ✓
                </div>
                <div className="w-0.5 h-8 bg-slate-700 my-2"></div>
              </div>
              <div>
                <p className="font-bold text-green-400">Bewerbung eingereicht</p>
                <p className="text-sm text-slate-400">Deine Daten wurden gespeichert</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  ⏳
                </div>
                <div className="w-0.5 h-8 bg-slate-700 my-2"></div>
              </div>
              <div>
                <p className="font-bold text-yellow-400">Admin-Review (24-48h)</p>
                <p className="text-sm text-slate-400">Deine Bewerbung wird überprüft</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  →
                </div>
              </div>
              <div>
                <p className="font-bold text-purple-400">Genehmigung & Einladung</p>
                <p className="text-sm text-slate-400">Du erhältst eine Email oder Discord Nachricht</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hinweise */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-8 flex gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-blue-300">
              <span className="font-bold">Hinweis:</span> Überprüfe regelmäßig deine Emails (auch Spam-Ordner). Bei Fragen kannst du uns auf Discord kontaktieren!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            ← Zur Startseite
          </button>
          <button
            onClick={() => router.push("/ranking")}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
          >
            📊 Zur Rangliste →
          </button>
        </div>
      </div>
    );
  }

  // 1. Wenn nicht eingeloggt
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
        <p className="text-slate-400 mb-8">Melde dich jetzt an!</p>

        <div className="bg-gradient-to-r from-blue-900 to-cyan-900 border border-blue-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">🔐 Du musst eingeloggt sein</h2>
          <p className="text-slate-200 mb-6">
            Um dich anzumelden, musst du dich zuerst mit Discord einloggen. Das ermöglicht uns, deine Discord-Daten automatisch zu erfassen.
          </p>
          <button
            onClick={() => signIn("discord")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition inline-flex items-center gap-2"
          >
            🎮 Mit Discord einloggen
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="font-bold mb-3">Warum Discord?</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✓ Dein Discord-Name wird automatisch übernommen</li>
            <li>✓ Schneller und sicherer Anmeldeprozess</li>
            <li>✓ Du kannst direkt der Community beitreten</li>
            <li>✓ Deine Daten sind geschützt</li>
          </ul>
        </div>
      </div>
    );
  }

  // 2. Wenn eingeloggt aber NICHT auf Discord Server
  if (!isDiscordMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
        <p className="text-slate-400 mb-8">Melde dich jetzt an!</p>

        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-green-400">Du bist eingeloggt</p>
            <p className="text-sm text-slate-300">Discord User: <span className="font-bold">{session.user?.name}</span></p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">🔗 Discord Server beitreten</h2>
          <p className="text-slate-200 mb-6">
            Um dich anzumelden, musst du zuerst unserem Discord Server beitreten. Dort kannst du dich mit der Community austauschen und erhältst Updates zur MP Bankroll Cup!
          </p>
          <div className="flex gap-4">
            <a
              href="https://discord.gg/YbeKE6YEa8"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition inline-flex items-center gap-2"
            >
              🎮 Zum Discord Server
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Du wirst in einem neuen Fenster zum Discord Server weitergeleitet. Klicke dort auf "Join" um beizutreten.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-300 mb-4">
            Hast du den Discord Server beigetreten?
          </p>
          <button
            onClick={checkDiscordMembership}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:bg-slate-600"
            disabled={checkingMembership}
          >
            {checkingMembership ? "Wird überprüft..." : "✅ Ja, ich bin beigetreten - Überprüfen"}
          </button>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-xs text-slate-300">
              <p className="font-bold mb-2">Debug Info:</p>
              <p>{debugInfo}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Wenn eingeloggt UND auf Discord Server (isDiscordMember = true)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
      <p className="text-slate-400 mb-8">Melde dich jetzt an!</p>

      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-8 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-bold text-green-400">Du bist eingeloggt & im Discord Server</p>
          <p className="text-sm text-slate-300">Discord User: <span className="font-bold">{session.user?.name}</span></p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-700 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">📋 Voraussetzungen</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span>Du spielst regelmäßig Poker auf GGPoker</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span>Du hast mindestens €500 Bankroll</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span>Du bist bereit, deine Fortschritte zu teilen</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span>Du hast einen Discord Account</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span>Du möchtest Teil einer Community sein</span>
          </li>
        </ul>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6"
      >
        <div>
          <label className="block text-sm font-bold mb-2">Vollständiger Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="z.B. Max Mustermann"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Email Adresse * <span className="text-xs text-slate-400">(von deinem Discord Account)</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            className="w-full bg-slate-900 border border-green-700 rounded px-4 py-2 text-green-400 outline-none cursor-not-allowed opacity-75"
            placeholder="Wird automatisch übernommen"
          />
          <p className="text-xs text-green-400 mt-1">
            ✓ Automatisch von deinem Discord Account übernommen
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">GGPoker Username *</label>
          <input
            type="text"
            name="ggpokerNickname"
            value={formData.ggpokerNickname}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="Dein GGPoker Username"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Discord Username * <span className="text-xs text-slate-400">(von deinem Account)</span>
          </label>
          <input
            type="text"
            name="discord"
            value={formData.discord}
            readOnly
            className="w-full bg-slate-900 border border-green-700 rounded px-4 py-2 text-green-400 outline-none cursor-not-allowed opacity-75"
            placeholder="Wird automatisch übernommen"
          />
          <p className="text-xs text-green-400 mt-1">
            ✓ Automatisch von deinem Discord Account übernommen
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Livestream Link (optional - z.B. Twitch)
          </label>
          <input
            type="url"
            name="livestreamLink"
            value={formData.livestreamLink}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="https://twitch.tv/dein-channel"
          />
          <p className="text-xs text-slate-400 mt-1">
            Falls du streamst, trage deinen Twitch/Stream Link ein
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 rounded-lg transition"
        >
          {loading ? "Wird gespeichert..." : "✅ Anmeldung bestätigen"}
        </button>
      </form>

      <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-300 mb-2">
          <span className="font-bold">⏱️ Was kommt danach?</span>
        </p>
        <p className="text-slate-400 text-sm">
          Nach deiner Anmeldung werden wir deine Daten überprüfen und dich innerhalb von 24-48 Stunden per Email kontaktieren. Wenn alles passt, erhältst du deinen Discord Link und kannst der Community beitreten!
        </p>
      </div>
    </div>
  );
}