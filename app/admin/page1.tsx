"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Edit2, Save, X, Trash2, CheckCircle, Plus, Check } from "lucide-react";

interface BankrollUpdate {
  id: string;
  userId: string;
  userName: string;
  bankroll: number;
  notes: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
}

interface Player {
  id: string;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  livestreamLink: string;
  lastVerification: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  ggpokerNickname: string;
  discord: string;
  livestreamLink: string;
  bankroll: number;
  experience: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedByImage?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByImage?: string;
  rejectedAt?: string;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [regFilter, setRegFilter] = useState('pending'); 
  const [tab, setTab] = useState<"members" | "registrations" | "bankroll">("members");
  const [players, setPlayers] = useState<Player[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Player | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    ggpokerNickname: "",
    bankroll: "",
    livestreamLink: "",
  });
  const [bankrollUpdates, setBankrollUpdates] = useState<BankrollUpdate[]>([]);
  const [bankrollFilter, setBankrollFilter] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    const user = session.user as any;
    if (user.role !== "admin" && user.role !== "mod") {
      router.push("/");
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const playersResponse = await fetch("/api/players");
      const playersData = await playersResponse.json();
      setPlayers(playersData || []);

      const regsResponse = await fetch("/api/registrations");
      const regsData = await regsResponse.json();
      setRegistrations(regsData || []);

      const bankrollResponse = await fetch("/api/bankroll-updates");
      const bankrollData = await bankrollResponse.json();
      setBankrollUpdates(bankrollData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.name || !newPlayer.ggpokerNickname || !newPlayer.bankroll) {
      alert("Bitte fülle alle Pflichtfelder aus!");
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name,
      ggpokerNickname: newPlayer.ggpokerNickname,
      bankroll: parseFloat(newPlayer.bankroll),
      livestreamLink: newPlayer.livestreamLink || "",
      lastVerification: getTodayDate(),
    };

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      });

      if (response.ok) {
        setPlayers([...players, player]);
        setShowAddModal(false);
        setNewPlayer({
          name: "",
          ggpokerNickname: "",
          bankroll: "",
          livestreamLink: "",
        });
        alert("✅ Spieler hinzugefügt!");
      }
    } catch (error) {
      alert("❌ Fehler beim Speichern!");
    }
  };

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setEditData(JSON.parse(JSON.stringify(player)));
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      const response = await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setPlayers(players.map((p) => (p.id === editData.id ? editData : p)));
        setEditingId(null);
        setEditData(null);
        alert("✅ Spieler aktualisiert!");
      }
    } catch (error) {
      alert("❌ Fehler beim Speichern!");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleVerify = async (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const updatedPlayer = {
      ...player,
      lastVerification: getTodayDate(),
    };

    try {
      const response = await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlayer),
      });

      if (response.ok) {
        setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));
        alert("✅ Verifiziert!");
      }
    } catch (error) {
      alert("❌ Fehler!");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (confirm("Spieler wirklich löschen?")) {
      try {
        const response = await fetch("/api/players", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setPlayers(players.filter((p) => p.id !== id));
          alert("✅ Gelöscht!");
        }
      } catch (error) {
        alert("❌ Fehler!");
      }
    }
  };

  const updateField = (field: keyof Player, value: string | number) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  // ===== BANKROLL UPDATE HANDLERS =====
  const user = session?.user as any;
  
  const filteredBankrollUpdates = bankrollUpdates
    .filter((update) => update.status === bankrollFilter)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleApproveBankroll = async (id: string) => {
    try {
      const update = bankrollUpdates.find((u) => u.id === id);
      if (!update) return;

      await fetch("/api/bankroll-updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id,
          status: "approved",
          approvedBy: user?.name,
        }),
      });

      const player = players.find((p) => p.name === update.userName);
      if (player) {
        await fetch("/api/players", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...player,
            bankroll: update.bankroll,
            lastVerification: getTodayDate(),
          }),
        });
        setPlayers(
          players.map((p) =>
            p.name === update.userName
              ? { ...p, bankroll: update.bankroll, lastVerification: getTodayDate() }
              : p
          )
        );
      }

      setBankrollUpdates(
        bankrollUpdates.map((u) =>
          u.id === id ? { ...u, status: "approved", approvedBy: user?.name } : u
        )
      );
      alert("✅ Bankroll genehmigt und Spieler aktualisiert!");
    } catch (error) {
      alert("❌ Fehler beim Genehmigen!");
    }
  };

  const handleRejectBankroll = async (id: string) => {
    try {
      const update = bankrollUpdates.find((u) => u.id === id);
      if (!update) return;

      await fetch("/api/bankroll-updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id,
          status: "rejected",
        }),
      });

      setBankrollUpdates(
        bankrollUpdates.map((u) =>
          u.id === id ? { ...u, status: "rejected" } : u
        )
      );
      alert("✅ Bankroll abgelehnt!");
    } catch (error) {
      alert("❌ Fehler beim Ablehnen!");
    }
  };

  const handleDeleteBankroll = async (id: string) => {
    if (confirm("Bankroll Update wirklich löschen?")) {
      try {
        await fetch("/api/bankroll-updates", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        setBankrollUpdates(bankrollUpdates.filter((u) => u.id !== id));
        alert("✅ Gelöscht!");
      } catch (error) {
        alert("❌ Fehler beim Löschen!");
      }
    }
  };

  // Filter für Registrations (falls nicht vorhanden)
  const filteredRegs = registrations.filter(
    (reg) => reg.status === regFilter
  );

  // Placeholder Funktionen für Registrations (falls nicht vorhanden)
  const handleApproveReg = async (id: string) => {
    console.log("Approve registration:", id);
  };

  const handleRejectReg = async (id: string) => {
    console.log("Reject registration:", id);
  };

  const handleDeleteReg = async (id: string) => {
    console.log("Delete registration:", id);
  };

  if (loading) {
    return <div className="p-8 text-white">Lädt...</div>;
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setTab("members")}
          className={
            tab === "members"
              ? "px-6 py-2 bg-blue-600 rounded font-bold"
              : "px-6 py-2 bg-slate-700 rounded"
          }
        >
          Mitglieder verwalten
        </button>
        <button
          onClick={() => setTab("registrations")}
          className={
            tab === "registrations"
              ? "px-6 py-2 bg-blue-600 rounded font-bold"
              : "px-6 py-2 bg-slate-700 rounded"
          }
        >
          Anmeldungen
        </button>
        <button
          onClick={() => setTab("bankroll")}
          className={
            tab === "bankroll"
              ? "px-6 py-2 bg-blue-600 rounded font-bold"
              : "px-6 py-2 bg-slate-700 rounded"
          }
        >
          Bankroll Updates
        </button>
      </div>

      {tab === "members" && (
        <>
          <h2 className="text-2xl font-bold mb-8">Mitglieder verwalten</h2>

          <button
            onClick={() => setShowAddModal(true)}
            className="mb-6 px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus size={20} /> Spieler hinzufügen
          </button>

          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Neuer Spieler</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="GGPoker Nickname"
                  value={newPlayer.ggpokerNickname}
                  onChange={(e) => setNewPlayer({ ...newPlayer, ggpokerNickname: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
                <input
                  type="number"
                  placeholder="Bankroll"
                  value={newPlayer.bankroll}
                  onChange={(e) => setNewPlayer({ ...newPlayer, bankroll: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
                <input
                  type="url"
                  placeholder="Livestream Link (optional)"
                  value={newPlayer.livestreamLink}
                  onChange={(e) => setNewPlayer({ ...newPlayer, livestreamLink: e.target.value })}
                  className="w-full mb-4 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPlayer}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-bold">Name</th>
                  <th className="px-6 py-4 text-left font-bold">GGPoker</th>
                  <th className="px-6 py-4 text-right font-bold">Bankroll</th>
                  <th className="px-6 py-4 text-left font-bold">Livestream</th>
                  <th className="px-6 py-4 text-left font-bold">Verifiziert</th>
                  <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    {editingId === player.id && editData ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              updateField("name", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.ggpokerNickname}
                            onChange={(e) =>
                              updateField("ggpokerNickname", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editData.bankroll}
                            onChange={(e) =>
                              updateField("bankroll", parseFloat(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white text-right"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="url"
                            value={editData.livestreamLink}
                            onChange={(e) =>
                              updateField("livestreamLink", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editData.lastVerification}
                            onChange={(e) =>
                              updateField("lastVerification", e.target.value)
                            }
                            className="w-full bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white"
                          />
                        </td>
                        <td className="px-6 py-4 flex gap-2 justify-center">
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 p-2 rounded transition"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded transition"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold">{player.name}</td>
                        <td className="px-6 py-4">{player.ggpokerNickname}</td>
                        <td className="px-6 py-4 text-right font-bold">
                          €{player.bankroll}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-400">
                          {player.livestreamLink
                            ? player.livestreamLink.substring(0, 25)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(
                            player.lastVerification
                          ).toLocaleDateString("de-DE")}
                        </td>
                        <td className="px-6 py-4 flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(player)}
                            className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleVerify(player.id)}
                            className="bg-green-600 hover:bg-green-700 p-2 rounded transition"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "registrations" && (
        <>
          <h2 className="text-2xl font-bold mb-8">Anmeldungen verwalten</h2>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8">
            <button
              onClick={() => setRegFilter("pending")}
              className={
                regFilter === "pending"
                  ? "bg-yellow-600 text-white px-4 py-2 rounded mr-2 font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
              }
            >
              Ausstehend ({registrations.filter((r) => r.status === "pending").length})
            </button>
            <button
              onClick={() => setRegFilter("approved")}
              className={
                regFilter === "approved"
                  ? "bg-green-600 text-white px-4 py-2 rounded mr-2 font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
              }
            >
              Genehmigt ({registrations.filter((r) => r.status === "approved").length})
            </button>
            <button
              onClick={() => setRegFilter("rejected")}
              className={
                regFilter === "rejected"
                  ? "bg-red-600 text-white px-4 py-2 rounded font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded"
              }
            >
              Abgelehnt ({registrations.filter((r) => r.status === "rejected").length})
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-bold">Name</th>
                  <th className="px-6 py-4 text-left font-bold">Email</th>
                  <th className="px-6 py-4 text-left font-bold">GGPoker</th>
                  <th className="px-6 py-4 text-left font-bold">Discord</th>
                  <th className="px-6 py-4 text-left font-bold">Livestream</th>
                  <th className="px-6 py-4 text-left font-bold">Datum</th>
                  <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 text-sm">
                      {reg.status === "approved" && reg.approvedBy && (
                        <span className="text-green-400 font-bold">✓ {reg.approvedBy}</span>
                      )}
                      {reg.status === "rejected" && reg.rejectedBy && (
                        <span className="text-red-400 font-bold">✗ {reg.rejectedBy}</span>
                      )}
                      {reg.status === "pending" && (
                        <span className="text-yellow-400">ausstehend</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{reg.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{reg.email}</td>
                    <td className="px-6 py-4 text-sm">{reg.ggpokerNickname}</td>
                    <td className="px-6 py-4 text-sm">{reg.discord}</td>
                    <td className="px-6 py-4 text-sm text-blue-400">
                      {reg.livestreamLink ? reg.livestreamLink.substring(0, 25) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(reg.createdAt).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center">
                      {reg.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveReg(reg.id)}
                            className="bg-green-600 hover:bg-green-700 p-2 rounded"
                            title="Genehmigen"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectReg(reg.id)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded"
                            title="Ablehnen"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteReg(reg.id)}
                        className="bg-slate-600 hover:bg-slate-700 p-2 rounded"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "bankroll" && (
        <>
          <h2 className="text-2xl font-bold mb-8">Bankroll Updates verwalten</h2>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8">
            <button
              onClick={() => setBankrollFilter("pending")}
              className={
                bankrollFilter === "pending"
                  ? "bg-yellow-600 text-white px-4 py-2 rounded mr-2 font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
              }
            >
              Ausstehend ({bankrollUpdates.filter((u) => u.status === "pending").length})
            </button>
            <button
              onClick={() => setBankrollFilter("approved")}
              className={
                bankrollFilter === "approved"
                  ? "bg-green-600 text-white px-4 py-2 rounded mr-2 font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
              }
            >
              Genehmigt ({bankrollUpdates.filter((u) => u.status === "approved").length})
            </button>
            <button
              onClick={() => setBankrollFilter("rejected")}
              className={
                bankrollFilter === "rejected"
                  ? "bg-red-600 text-white px-4 py-2 rounded font-bold"
                  : "bg-slate-700 text-slate-300 px-4 py-2 rounded"
              }
            >
              Abgelehnt ({bankrollUpdates.filter((u) => u.status === "rejected").length})
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-bold">Zeitstempel</th>
                  <th className="px-6 py-4 text-left font-bold">Spieler</th>
                  <th className="px-6 py-4 text-left font-bold">Neuer Bankroll</th>
                  <th className="px-6 py-4 text-left font-bold">Notizen</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredBankrollUpdates.map((update) => (
                  <tr
                    key={update.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-300 whitespace-nowrap">
                      {new Date(update.createdAt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold">{update.userName}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">
                      €{update.bankroll}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {update.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {update.status === "approved" && (
                        <span className="text-green-400 font-bold">✓ Genehmigt</span>
                      )}
                      {update.status === "rejected" && (
                        <span className="text-red-400 font-bold">✗ Abgelehnt</span>
                      )}
                      {update.status === "pending" && (
                        <span className="text-yellow-400 font-bold">⏳ Ausstehend</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center">
                      {update.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveBankroll(update.id)}
                            className="bg-green-600 hover:bg-green-700 p-2 rounded transition"
                            title="Genehmigen"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectBankroll(update.id)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded transition"
                            title="Ablehnen"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteBankroll(update.id)}
                        className="bg-slate-600 hover:bg-slate-700 p-2 rounded transition"
                        title="Löschen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBankrollUpdates.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Keine Bankroll Updates in diesem Status
            </div>
          )}
        </>
      )}
    </div>
  );
}
