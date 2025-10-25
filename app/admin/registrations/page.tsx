"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, Check, X } from "lucide-react";

interface Registration {
  id: string;
  name: string;
  email: string;
  ggpokerNickname: string;
  discord: string;
  bankroll: number;
  experience: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function Registrations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

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

    loadRegistrations();
  }, [session, status, router]);

  const loadRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations");
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error("Error loading registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch("/api/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      setRegistrations(
        registrations.map((r) =>
          r.id === id ? { ...r, status: "approved" } : r
        )
      );
      alert("✅ Genehmigt!");
    } catch (error) {
      alert("❌ Fehler!");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch("/api/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected" }),
      });
      setRegistrations(
        registrations.map((r) =>
          r.id === id ? { ...r, status: "rejected" } : r
        )
      );
      alert("❌ Abgelehnt!");
    } catch (error) {
      alert("❌ Fehler!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;

    try {
      await fetch("/api/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRegistrations(registrations.filter((r) => r.id !== id));
      alert("✅ Gelöscht!");
    } catch (error) {
      alert("❌ Fehler!");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-slate-400">Wird geladen...</p>
      </div>
    );
  }

  const filteredRegs = registrations.filter((r) => r.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Anmeldungen verwalten</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8">
        <button
          onClick={() => setFilter("pending")}
          className={
            filter === "pending"
              ? "bg-yellow-600 text-white px-4 py-2 rounded mr-2 font-bold"
              : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
          }
        >
          Ausstehend ({registrations.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={
            filter === "approved"
              ? "bg-green-600 text-white px-4 py-2 rounded mr-2 font-bold"
              : "bg-slate-700 text-slate-300 px-4 py-2 rounded mr-2"
          }
        >
          Genehmigt ({registrations.filter((r) => r.status === "approved").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={
            filter === "rejected"
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
              <th className="px-6 py-4 text-right font-bold">Bankroll</th>
              <th className="px-6 py-4 text-left font-bold">Level</th>
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
                <td className="px-6 py-4 font-bold">{reg.name}</td>
                <td className="px-6 py-4 text-sm text-blue-400">{reg.email}</td>
                <td className="px-6 py-4">{reg.ggpokerNickname}</td>
                <td className="px-6 py-4 text-slate-400">{reg.discord}</td>
                <td className="px-6 py-4 text-right font-bold">
                  €{reg.bankroll}
                </td>
                <td className="px-6 py-4 text-sm">{reg.experience}</td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(reg.createdAt).toLocaleDateString("de-DE")}
                </td>
                <td className="px-6 py-4 flex gap-2 justify-center">
                  {reg.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(reg.id)}
                        className="bg-green-600 hover:bg-green-700 p-2 rounded"
                        title="Genehmigen"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleReject(reg.id)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded"
                        title="Ablehnen"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(reg.id)}
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
    </div>
  );
}