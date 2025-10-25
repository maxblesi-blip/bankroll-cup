"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnmeldungPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ggpokerNickname: "",
    discord: "",
    livestreamLink: "",
  });

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
      // Validierung - Livestream Link ist optional
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

      // Sende an /api/registrations
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
          bankroll: 0,
          experience: "beginner",
          createdAt: new Date().toISOString(),
          status: "pending",
        }),
      });

      if (response.ok) {
        alert("✅ Anmeldung erfolgreich! Wir werden dich bald kontaktieren.");
        setFormData({
          name: "",
          email: "",
          ggpokerNickname: "",
          discord: "",
          livestreamLink: "",
        });
        router.push("/");
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">🃏 MP Bankroll Cup</h1>
      <p className="text-slate-400 mb-8">Melde dich jetzt an!</p>

      {/* Voraussetzungen */}
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

      {/* Anmeldungsformular */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6"
      >
        {/* Name */}
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

        {/* Email */}
        <div>
          <label className="block text-sm font-bold mb-2">Email Adresse *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="deine@email.com"
            required
          />
        </div>

        {/* GGPoker Nickname */}
        <div>
          <label className="block text-sm font-bold mb-2">
            GGPoker Username *
          </label>
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

        {/* Discord */}
        <div>
          <label className="block text-sm font-bold mb-2">Discord Username *</label>
          <input
            type="text"
            name="discord"
            value={formData.discord}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none"
            placeholder="Dein Discord Username"
            required
          />
        </div>

        {/* Livestream Link */}
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

        {/* Submit Button */}
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