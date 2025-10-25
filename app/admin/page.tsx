'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Edit2,
  Save,
  X,
  Trash2,
  Plus,
  Check,
  ChevronDown,
} from 'lucide-react';

interface BankrollUpdate {
  id: string;
  userId: string;
  userName: string;
  bankroll: number;
  notes: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

interface Player {
  id: string;
  email: string;
  name: string;
  ggpokerNickname: string;
  bankroll: number;
  livestreamLink: string;
  verification: string;
  lastUpdated: string;
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
  status: 'pending' | 'approved' | 'rejected';
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
  const [regFilter, setRegFilter] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [tab, setTab] = useState<'members' | 'registrations' | 'bankroll'>(
    'members'
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Player | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    ggpokerNickname: '',
    bankroll: '',
    livestreamLink: '',
  });
  const [bankrollUpdates, setBankrollUpdates] = useState<BankrollUpdate[]>([]);
  const [bankrollFilter, setBankrollFilter] = useState<
    'pending' | 'approved' | 'rejected'
  >('pending');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.role !== 'mod') {
      router.push('/');
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ Hole Spieler aus LEADERBOARD
      console.log('📊 Lade Spieler aus Leaderboard...');
      const playersResponse = await fetch('/api/leaderboard');
      const playersData = await playersResponse.json();

      console.log('📋 Leaderboard Rohdaten:', playersData);

      // Konvertiere Leaderboard Daten ins Player Format
      if (playersData.players && Array.isArray(playersData.players)) {
        const convertedPlayers = playersData.players.map((p: any) => ({
          id: p.id || p.email || p.name,
          email: p.email || '',
          name: p.name || '',
          ggpokerNickname: p.ggpokerNickname || '',
          bankroll: parseFloat(p.bankroll) || 0,
          livestreamLink: p.livestreamLink || '',
          verification: p.verification || '',
          lastUpdated: p.lastUpdated || '',
        }));
        console.log('✅ Konvertierte Spieler:', convertedPlayers);
        setPlayers(convertedPlayers);
      } else {
        console.warn('⚠️  Keine Spieler in Leaderboard gefunden');
        setPlayers([]);
      }

      // Hole Anmeldungen
      const regsResponse = await fetch('/api/registrations');
      const regsData = await regsResponse.json();
      setRegistrations(regsData || []);

      // Hole Bankroll Updates
      const bankrollResponse = await fetch('/api/bankroll-updates');
      const bankrollData = await bankrollResponse.json();
      setBankrollUpdates(bankrollData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

 const handleAddPlayer = async () => {
    if (
      !newPlayer.name ||
      !newPlayer.email ||
      !newPlayer.ggpokerNickname ||
      !newPlayer.bankroll
    ) {
      alert('Bitte fülle alle Pflichtfelder aus!');
      return;
    }

    const player: Player = {
      id: newPlayer.email, // ✅ Nutze Email als ID!
      name: newPlayer.name,
      email: newPlayer.email,
      ggpokerNickname: newPlayer.ggpokerNickname,
      bankroll: parseFloat(newPlayer.bankroll),
      livestreamLink: newPlayer.livestreamLink || '',
      verification: getTodayDate(),
      lastUpdated: getTodayDate(),
    };

    try {
      console.log(`➕ [ADD] Füge neuen Spieler hinzu:`, player);
      
      const response = await fetch('/api/leaderboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });

      if (response.ok) {
        console.log(`✅ [ADD] Spieler erfolgreich hinzugefügt`);
        setPlayers([...players, player]);
        setShowAddModal(false);
        setNewPlayer({
          name: '',
          email: '',
          ggpokerNickname: '',
          bankroll: '',
          livestreamLink: '',
        });
        alert('✅ Spieler hinzugefügt!');
      } else {
        const error = await response.json();
        console.error(`❌ [ADD] Fehler:`, error);
        alert('❌ Fehler beim Speichern!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Fehler beim Speichern!');
    }
  };

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setEditData(JSON.parse(JSON.stringify(player)));
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setPlayers(players.map((p) => (p.id === editData.id ? editData : p)));
        setEditingId(null);
        setEditData(null);
        alert('✅ Spieler aktualisiert!');
      }
    } catch (error) {
      alert('❌ Fehler beim Speichern!');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDeletePlayer = async (player: Player) => {
  if (confirm('Spieler wirklich löschen?')) {
    try {
      console.log(`🗑️ [DELETE] Lösche Spieler:`, player);
      
      const response = await fetch('/api/leaderboard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: player.id,
          email: player.email, // ✅ EMAIL MITSENDET!
        }),
      });

      if (response.ok) {
        console.log(`✅ Spieler gelöscht`);
        setPlayers(players.filter((p) => p.email !== player.email));
        alert('✅ Spieler gelöscht!');
      } else {
        const error = await response.json();
        console.error(`❌ Fehler:`, error);
        alert('❌ Fehler beim Löschen!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Fehler beim Löschen!');
    }
  }
};

  const handleApproveReg = async (regId: string) => {
    try {
      const response = await fetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: session?.user?.name || 'Admin',
          approvedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setRegistrations(
          registrations.map((r) =>
            r.id === regId ? { ...r, status: 'approved' } : r
          )
        );
        alert('✅ Registrierung genehmigt!');
        loadData();
      }
    } catch (error) {
      alert('❌ Fehler beim Genehmigen!');
    }
  };

  const handleRejectReg = async (regId: string) => {
    try {
      const response = await fetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectedBy: session?.user?.name || 'Admin',
          rejectedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setRegistrations(
          registrations.map((r) =>
            r.id === regId ? { ...r, status: 'rejected' } : r
          )
        );
        alert('✅ Registrierung abgelehnt!');
      }
    } catch (error) {
      alert('❌ Fehler beim Ablehnen!');
    }
  };

  const handleApproveBankroll = async (bankrollId: string) => {
    try {
      const response = await fetch(`/api/bankroll-updates/${bankrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: session?.user?.name || 'Admin',
        }),
      });

      if (response.ok) {
        setBankrollUpdates(
          bankrollUpdates.map((u) =>
            u.id === bankrollId ? { ...u, status: 'approved' } : u
          )
        );
        alert('✅ Bankroll Update genehmigt!');
      }
    } catch (error) {
      alert('❌ Fehler beim Genehmigen!');
    }
  };

  const handleRejectBankroll = async (bankrollId: string) => {
    try {
      const response = await fetch(`/api/bankroll-updates/${bankrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          approvedBy: session?.user?.name || 'Admin',
        }),
      });

      if (response.ok) {
        setBankrollUpdates(
          bankrollUpdates.map((u) =>
            u.id === bankrollId ? { ...u, status: 'rejected' } : u
          )
        );
        alert('✅ Bankroll Update abgelehnt!');
      }
    } catch (error) {
      alert('❌ Fehler beim Ablehnen!');
    }
  };

  const handleDeleteBankroll = async (bankrollId: string) => {
    if (confirm('Bankroll Update wirklich löschen?')) {
      try {
        const response = await fetch(`/api/bankroll-updates/${bankrollId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setBankrollUpdates(bankrollUpdates.filter((u) => u.id !== bankrollId));
          alert('✅ Bankroll Update gelöscht!');
        }
      } catch (error) {
        alert('❌ Fehler beim Löschen!');
      }
    }
  };

  const filteredRegs = registrations.filter((r) => r.status === regFilter);
  const filteredBankrollUpdates = bankrollUpdates.filter(
    (u) => u.status === bankrollFilter
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-2xl font-bold text-slate-300">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* TAB NAVIGATION */}
      <div className="flex gap-4 mb-8 border-b border-slate-700">
        <button
          onClick={() => setTab('members')}
          className={`px-6 py-4 font-bold transition border-b-2 ${
            tab === 'members'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👥 Spieler verwalten ({players.length})
        </button>
        <button
          onClick={() => setTab('registrations')}
          className={`px-6 py-4 font-bold transition border-b-2 ${
            tab === 'registrations'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📝 Anmeldungen (
          {registrations.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setTab('bankroll')}
          className={`px-6 py-4 font-bold transition border-b-2 ${
            tab === 'bankroll'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💰 Bankroll Updates (
          {bankrollUpdates.filter((u) => u.status === 'pending').length})
        </button>
      </div>

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Spieler verwalten (Leaderboard)</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition"
            >
              <Plus size={20} /> Neuer Spieler
            </button>
          </div>

          {/* ADD MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6">Neuer Spieler</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={(e) =>
                        setNewPlayer({ ...newPlayer, name: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="z.B. Max Mustermann"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) =>
                        setNewPlayer({ ...newPlayer, email: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="z.B. max@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      GGPoker Nickname *
                    </label>
                    <input
                      type="text"
                      value={newPlayer.ggpokerNickname}
                      onChange={(e) =>
                        setNewPlayer({
                          ...newPlayer,
                          ggpokerNickname: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="z.B. MaxPoker88"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Bankroll * (EUR)
                    </label>
                    <input
                      type="number"
                      value={newPlayer.bankroll}
                      onChange={(e) =>
                        setNewPlayer({ ...newPlayer, bankroll: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      Livestream Link (optional)
                    </label>
                    <input
                      type="url"
                      value={newPlayer.livestreamLink}
                      onChange={(e) =>
                        setNewPlayer({
                          ...newPlayer,
                          livestreamLink: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="z.B. https://twitch.tv/..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleAddPlayer}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition"
                  >
                    ✅ Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewPlayer({
                        name: '',
                        email: '',
                        ggpokerNickname: '',
                        bankroll: '',
                        livestreamLink: '',
                      });
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded font-bold transition"
                  >
                    ❌ Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PLAYERS TABLE */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700">
                    <th className="px-6 py-4 text-left font-bold">Name</th>
                    <th className="px-6 py-4 text-left font-bold">Email</th>
                    <th className="px-6 py-4 text-left font-bold">GGPoker</th>
                    <th className="px-6 py-4 text-right font-bold">Bankroll</th>
                    <th className="px-6 py-4 text-left font-bold">Livestream</th>
                    <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) =>
                    editingId === player.id && editData ? (
                      <tr
                        key={player.id}
                        className="bg-blue-900/30 border-b border-slate-700"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) =>
                              setEditData({ ...editData, email: e.target.value })
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.ggpokerNickname}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                ggpokerNickname: e.target.value,
                              })
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editData.bankroll}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                bankroll: parseFloat(e.target.value),
                              })
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="url"
                            value={editData.livestreamLink}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                livestreamLink: e.target.value,
                              })
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleSave}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                              title="Speichern"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                              title="Abbrechen"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={player.id}
                        className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                      >
                        <td className="px-6 py-4 font-bold">{player.name}</td>
                        <td className="px-6 py-4 text-sm text-blue-400">
                          {player.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {player.ggpokerNickname}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-400">
                          EUR {player.bankroll}
                        </td>
                        <td className="px-6 py-4 text-sm text-purple-400">
                          {player.livestreamLink ? (
                            <a
                              href={player.livestreamLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Link
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(player)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
                              title="Bearbeiten"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                              title="Löschen"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {players.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Spieler vorhanden
              </div>
            )}
          </div>
        </>
      )}

      {/* REGISTRATIONS TAB */}
      {tab === 'registrations' && (
        <>
          <h2 className="text-2xl font-bold mb-6">Anmeldungen verwalten</h2>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setRegFilter('pending')}
              className={`px-4 py-2 rounded font-bold transition ${
                regFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⏳ Ausstehend (
              {registrations.filter((r) => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setRegFilter('approved')}
              className={`px-4 py-2 rounded font-bold transition ${
                regFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ✅ Genehmigt (
              {registrations.filter((r) => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setRegFilter('rejected')}
              className={`px-4 py-2 rounded font-bold transition ${
                regFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ❌ Abgelehnt (
              {registrations.filter((r) => r.status === 'rejected').length})
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700">
                    <th className="px-6 py-4 text-left font-bold">Name</th>
                    <th className="px-6 py-4 text-left font-bold">Status</th>
                    <th className="px-6 py-4 text-left font-bold">Datum</th>
                    <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((reg) => (
                    <tr
                      key={reg.id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="px-6 py-4 font-bold">{reg.name}</td>
                      <td className="px-6 py-4">
                        {reg.status === 'approved' && (
                          <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm font-bold">
                            ✅ Genehmigt
                          </span>
                        )}
                        {reg.status === 'rejected' && (
                          <span className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm font-bold">
                            ❌ Abgelehnt
                          </span>
                        )}
                        {reg.status === 'pending' && (
                          <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
                            ⏳ Ausstehend
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(reg.createdAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          {reg.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveReg(reg.id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                                title="Genehmigen"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleRejectReg(reg.id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                                title="Ablehnen"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRegs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Anmeldungen in diesem Status
              </div>
            )}
          </div>

          {filteredRegs.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold text-slate-300">Details</h3>
              {filteredRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedRegId(expandedRegId === reg.id ? null : reg.id)
                    }
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-700/50 transition"
                  >
                    <span className="font-bold">{reg.name}</span>
                    <ChevronDown
                      size={20}
                      className={`transition ${
                        expandedRegId === reg.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedRegId === reg.id && (
                    <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 space-y-3">
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="font-mono text-blue-400">{reg.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Discord</p>
                        <p className="font-mono text-purple-400">{reg.discord}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">GGPoker Nickname</p>
                        <p className="font-mono">{reg.ggpokerNickname}</p>
                      </div>
                      {reg.livestreamLink && (
                        <div>
                          <p className="text-sm text-slate-400">Livestream Link</p>
                          <a
                            href={reg.livestreamLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {reg.livestreamLink}
                          </a>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-400">Erfahrung</p>
                        <p>{reg.experience}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Angemeldet am</p>
                        <p>{new Date(reg.createdAt).toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BANKROLL TAB */}
      {tab === 'bankroll' && (
        <>
          <h2 className="text-2xl font-bold mb-6">Bankroll Updates verwalten</h2>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setBankrollFilter('pending')}
              className={`px-4 py-2 rounded font-bold transition ${
                bankrollFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⏳ Ausstehend (
              {bankrollUpdates.filter((u) => u.status === 'pending').length})
            </button>
            <button
              onClick={() => setBankrollFilter('approved')}
              className={`px-4 py-2 rounded font-bold transition ${
                bankrollFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ✅ Genehmigt (
              {bankrollUpdates.filter((u) => u.status === 'approved').length})
            </button>
            <button
              onClick={() => setBankrollFilter('rejected')}
              className={`px-4 py-2 rounded font-bold transition ${
                bankrollFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ❌ Abgelehnt (
              {bankrollUpdates.filter((u) => u.status === 'rejected').length})
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700">
                    <th className="px-6 py-4 text-left font-bold">Spieler</th>
                    <th className="px-6 py-4 text-right font-bold">Bankroll</th>
                    <th className="px-6 py-4 text-left font-bold">Notizen</th>
                    <th className="px-6 py-4 text-left font-bold">Status</th>
                    <th className="px-6 py-4 text-left font-bold">Datum</th>
                    <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBankrollUpdates.map((update) => (
                    <tr
                      key={update.id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                    >
                      <td className="px-6 py-4 font-bold">{update.userName}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">
                        EUR {update.bankroll}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {update.notes || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {update.status === 'approved' && (
                          <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm font-bold">
                            ✅ Genehmigt
                          </span>
                        )}
                        {update.status === 'rejected' && (
                          <span className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm font-bold">
                            ❌ Abgelehnt
                          </span>
                        )}
                        {update.status === 'pending' && (
                          <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
                            ⏳ Ausstehend
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(update.createdAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          {update.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveBankroll(update.id)
                                }
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                                title="Genehmigen"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectBankroll(update.id)
                                }
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                                title="Ablehnen"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteBankroll(update.id)
                            }
                            className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded transition"
                            title="Löschen"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBankrollUpdates.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Bankroll Updates in diesem Status
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}