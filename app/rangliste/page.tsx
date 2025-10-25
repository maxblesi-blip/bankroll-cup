// app/rangliste/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

interface Player {
  rank: number;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  startBankroll: number;
  percentToGoal: number;
  lastVerification: string;
  livestreamLink?: string;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

export default function Rangliste() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeframe, setTimeframe] = useState("week");
  const [loading, setLoading] = useState(true);

  // Mock Daten - würde von Google Sheets kommen
  const mockPlayers: Player[] = [
    {
      rank: 1,
      name: "Spieler A",
      ggpokerNickname: "ProPlayer123",
      bankroll: 3500,
      startBankroll: 500,
      percentToGoal: 70,
      lastVerification: "2025-10-22",
      livestreamLink: "https://twitch.tv/prostream",
    },
    {
      rank: 2,
      name: "Spieler B",
      ggpokerNickname: "HighRoller99",
      bankroll: 2800,
      startBankroll: 500,
      percentToGoal: 56,
      lastVerification: "2025-10-22",
    },
    {
      rank: 3,
      name: "Spieler C",
      ggpokerNickname: "GrindNinja",
      bankroll: 2100,
      startBankroll: 500,
      percentToGoal: 42,
      lastVerification: "2025-10-21",
    },
    {
      rank: 4,
      name: "Spieler D",
      ggpokerNickname: "PokerMaster88",
      bankroll: 1500,
      startBankroll: 500,
      percentToGoal: 30,
      lastVerification: "2025-10-20",
    },
    {
      rank: 5,
      name: "Spieler E",
      ggpokerNickname: "LuckyCards",
      bankroll: 750,
      startBankroll: 500,
      percentToGoal: 15,
      lastVerification: "2025-10-19",
    },
  ];

  const mockChartData: ChartData[] = [
    {
      date: "Wk 1",
      "Spieler A": 500,
      "Spieler B": 500,
      "Spieler C": 500,
      "Spieler D": 500,
    },
    {
      date: "Wk 2",
      "Spieler A": 650,
      "Spieler B": 580,
      "Spieler C": 520,
      "Spieler D": 490,
    },
    {
      date: "Wk 3",
      "Spieler A": 1200,
      "Spieler B": 1100,
      "Spieler C": 900,
      "Spieler D": 700,
    },
    {
      date: "Wk 4",
      "Spieler A": 1800,
      "Spieler B": 1500,
      "Spieler C": 1300,
      "Spieler D": 900,
    },
    {
      date: "Wk 5",
      "Spieler A": 3500,
      "Spieler B": 2800,
      "Spieler C": 2100,
      "Spieler D": 1500,
    },
  ];

  useEffect(() => {
    // In Produktion: Daten von Google Sheets holen
    setPlayers(mockPlayers);
    setChartData(mockChartData);
    setLoading(false);
  }, []);

  const progressToGoal = (bankroll: number) => {
    return Math.min((bankroll / 5000) * 100, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Rangliste</h1>
        <p className="text-slate-400">
          Verfolge den Fortschritt aller Spieler im MP Bankroll Cup
        </p>
      </div>

      {/* Timeframe Selection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-slate-400 mr-6">
            <Calendar size={18} />
            <span>Zeitraum:</span>
          </div>
          {["week", "month", "all"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeframe === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {t === "week" && "Diese Woche"}
              {t === "month" && "Diesen Monat"}
              {t === "all" && "Gesamte Serie"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-400" />
          Bankroll Verlauf
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              formatter={(value) => `€${value}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Spieler A"
              stroke="#fbbf24"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Spieler B"
              stroke="#a78bfa"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Spieler C"
              stroke="#60a5fa"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Spieler D"
              stroke="#34d399"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rankings Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Platz
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Spieler
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  GGPoker Nickname
                </th>
                <th className="px-6 py-4 text-right font-bold text-slate-300">
                  Bankroll
                </th>
                <th className="px-6 py-4 text-center font-bold text-slate-300">
                  Fortschritt
                </th>
                <th className="px-6 py-4 text-left font-bold text-slate-300">
                  Letzte Verifikation
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.rank}
                  className={`border-b border-slate-700 hover:bg-slate-700 transition ${
                    index === 0 ? "bg-slate-700/50" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    {index === 0 ? (
                      <div className="text-2xl font-bold text-yellow-400">
                        🥇
                      </div>
                    ) : index === 1 ? (
                      <div className="text-2xl">🥈</div>
                    ) : index === 2 ? (
                      <div className="text-2xl">🥉</div>
                    ) : (
                      <span className="font-bold text-lg">#{player.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold">{player.name}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {player.ggpokerNickname}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold">€{player.bankroll}</span>
                    <div className="text-sm text-slate-400">
                      +€{player.bankroll - player.startBankroll}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${progressToGoal(player.bankroll)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {Math.round(progressToGoal(player.bankroll))}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(player.lastVerification).toLocaleDateString(
                      "de-DE"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Teilnehmer</h3>
          <p className="text-3xl font-bold">{players.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Führender Spieler</h3>
          <p className="text-3xl font-bold">{players[0]?.name}</p>
          <p className="text-yellow-400 text-sm">€{players[0]?.bankroll}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-slate-400 text-sm mb-2">Fortschritt zum Ziel</h3>
          <p className="text-3xl font-bold">
            {Math.round((players[0]?.bankroll / 5000) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
