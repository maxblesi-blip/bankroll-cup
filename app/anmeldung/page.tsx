"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { CheckCircle, Loader } from "lucide-react";

interface RegistrationData {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function AnmeldungPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [isDiscordMember, setIsDiscordMember] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // ✅ SUCCESS State
  const [successData, setSuccessData] = useState<RegistrationData | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

  // ✅ Prüfe ob User bereits registriert ist
  const checkIfAlreadyRegistered = async (userEmail: string) => {
    try {
      console.log(`🔍 Prüfe ob ${userEmail} bereits registriert ist...`);
      
      const res = await fetch("/api/registrations");
      const registrations = await res.json();
      
      if (!Array.isArray(registrations)) {
        console.warn("❌ Keine Registrierungen gefunden");
        return;
      }

      const existing = registrations.find(
        (r: any) => r.email?.toLowerCase() === userEmail?.toLowerCase()
      );

      if (existing) {
        console.log(`✅ User bereits registriert:`, existing);
        setSuccessData({
          id: existing.id,
          name: existing.name,
          email: existing.email,
          status: existing.status || "pending",
        });
      } else {
        console.log(`ℹ️  User nicht registriert - Formular anzeigen`);
      }
    } catch (error) {
      console.error("❌ Error checking registration:", error);
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
        name: prev.name,
        discord: user.discordUsername || user.name || user.discord || "",
        email: emailFromDiscord,
        livestreamLink: prev.livestreamLink || user.livestreamLink || user.bio || "",
      }));
      
      // ✅ Prüfe ob User bereits im Registrierungen Sheet ist
      checkIfAlreadyRegistered(emailFromDiscord);
      
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
          email: formData.email,
          ggpokerNickname: formData.ggpokerNickname,
          discord: formData.discord,
          livestreamLink: formData.livestreamLink,
          discordId: getDiscordUserId(),
          bankroll: 0,
          experience: "beginner",
          createdAt: new Date().toISOString(),
          status: "pending",
        }),
      });

      if (response.ok) {
        console.log("✅ Registrierung erfolgreich eingereicht!");
        
        // ✅ Statt redirect, prüfe Registrierung und zeige Success Screen
        await checkIfAlreadyRegistered(formData.email);
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

  // ✅ SUCCESS STATE - Wenn bereits registriert
  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
        <p className="text-slate-400 mb-8">Danke für deine Anmeldung!</p>

        <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-green-400 mb-2">✅ Anmeldung erhalten</p>
              <p className="text-slate-300">
                Deine Anmeldung wurde erfolgreich eingereicht! Wir überprüfen deine Daten und melden uns innerhalb von 24-48 Stunden bei dir.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4 mb-8">
          <h3 className="font-bold text-lg">📋 Deine Daten</h3>
          <div>
            <p className="text-slate-400 text-sm">Name</p>
            <p className="font-bold">{successData.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Email</p>
            <p className="font-bold">{successData.email}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <p className="font-bold text-yellow-400 capitalize">{successData.status}</p>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <p className="text-slate-300">
            💬 Weitere Fragen? Schreib uns im{" "}
            <a
              href="https://discord.gg/YbeKE6YEa8"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-400 hover:text-blue-300"
            >
              Discord
            </a>
          </p>
        </div>
      </div>
    );
  }

  // 1. Wenn NICHT eingeloggt
  if (status === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
        <p className="text-slate-400 mb-8">Melde dich jetzt an!</p>

        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">🔐 Discord Anmeldung erforderlich</h2>
          <p className="text-slate-200 mb-6">
            Um dich anzumelden, logge dich zunächst mit deinem Discord Account ein.
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

  // Loading während Session lädt
  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-purple-400" />
          <p className="text-slate-300">Wird geladen...</p>
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
            <p className="text-sm text-slate-300">Discord User: <span className="font-bold">{session?.user?.name}</span></p>
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
          <p className="text-sm text-slate-300">Discord User: <span className="font-bold">{session?.user?.name}</span></p>
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
            Email Adresse *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="Deine Email Adresse"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Von deinem Discord Account vorausgefüllt - aber du kannst sie ändern
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