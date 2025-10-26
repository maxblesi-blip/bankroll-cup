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
  Mail,
  User,
  Twitch,
  Link as LinkIcon,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface BankrollUpdate {
  id: string;
  userId: string;
  userName: string;
  bankroll: number;
  notes: string;
  proofImageUrl?: string;
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
  discordId?: string;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  ggpokerNickname: string;
  discord: string;
  discordId?: string;
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
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
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
  
  // ✅ NEU: Modal für Foto-Vergrößerung
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [zoom, setZoom] = useState(1);

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
          discordId: p.discordId || '',
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
      id: newPlayer.email,
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
            email: player.email,
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

  // ✅ NEU: Approve mit neuer Route
  const handleApproveReg = async (reg: Registration) => {
    try {
      setApprovingId(reg.id);
      const user = session?.user as any;

      console.log(`✅ Genehmige: ${reg.name}`);

      const response = await fetch('/api/registrations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          approvedBy: user?.name || user?.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${data.message}`);

        setRegistrations(
          registrations.map((r) =>
            r.id === reg.id ? { ...r, status: 'approved' } : r
          )
        );
        setSelectedReg(null);
        alert('✅ Registrierung genehmigt!');
      } else {
        const error = await response.json();
        console.error(`❌ Fehler:`, error);
        alert('❌ Fehler beim Genehmigen!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Fehler beim Genehmigen!');
    } finally {
      setApprovingId(null);
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
        setSelectedReg(null);
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
      <h1 className="text-4xl font-bold mb-8">👥 Dashboard</h1>

      {/* ✅ NEU: Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Vergrößert"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
              title="Schließen"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

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
          💰 Bankroll ({bankrollUpdates.filter((u) => u.status === 'pending').length})
        </button>
      </div>

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Spieler verwalten</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={20} /> Spieler hinzufügen
            </button>
          </div>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold mb-6">Neuen Spieler hinzufügen</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPlayer.name}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, name: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newPlayer.email}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, email: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="GGPoker Nickname"
                    value={newPlayer.ggpokerNickname}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, ggpokerNickname: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Bankroll (EUR)"
                    value={newPlayer.bankroll}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, bankroll: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                  />
                  <input
                    type="url"
                    placeholder="Livestream Link (optional)"
                    value={newPlayer.livestreamLink}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, livestreamLink: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddPlayer}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition"
                    >
                      ✅ Hinzufügen
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition"
                    >
                      ❌ Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700">
                    <th className="px-6 py-4 text-left font-bold">Name</th>
                    <th className="px-6 py-4 text-left font-bold">Email</th>
                    <th className="px-6 py-4 text-left font-bold">GGPoker</th>
                    <th className="px-6 py-4 text-left font-bold">Discord ID</th>
                    <th className="px-6 py-4 text-right font-bold">Bankroll</th>
                    <th className="px-6 py-4 text-left font-bold">Livestream</th>
                    <th className="px-6 py-4 text-center font-bold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) =>
                    editingId === player.id && editData ? (
                      <tr key={player.id} className="bg-slate-700 border-b border-slate-700">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={editData.email}
                            disabled
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 opacity-50 cursor-not-allowed"
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
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.discordId || ''}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                discordId: e.target.value,
                              })
                            }
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 font-mono text-sm"
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
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-right"
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
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1"
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
                        <td className="px-6 py-4 text-sm font-mono text-purple-400 border-l border-purple-700">
                          {player.discordId || '-'}
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

      {/* REGISTRATIONS TAB - CRM VIEW */}
      {tab === 'registrations' && (
        <>
          <h2 className="text-2xl font-bold mb-6">Anmeldungen verwalten (CRM)</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2 sticky top-20">
                <h3 className="font-bold text-purple-400 mb-3">Filter</h3>

                {[
                  {
                    value: 'pending',
                    label: '⏳ Ausstehend',
                    count: registrations.filter((r) => r.status === 'pending').length,
                  },
                  {
                    value: 'approved',
                    label: '✅ Genehmigt',
                    count: registrations.filter((r) => r.status === 'approved').length,
                  },
                  {
                    value: 'rejected',
                    label: '❌ Abgelehnt',
                    count: registrations.filter((r) => r.status === 'rejected').length,
                  },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setRegFilter(f.value as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      regFilter === f.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    <span className="font-bold">{f.label}</span>
                    <span className="float-right text-xs bg-slate-900 px-2 py-1 rounded">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {selectedReg ? (
                // ✅ DETAIL VIEW
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                  <button
                    onClick={() => setSelectedReg(null)}
                    className="text-slate-400 hover:text-slate-300 mb-6 font-bold"
                  >
                    ← Zurück
                  </button>

                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-slate-700 pb-6">
                      <h2 className="text-3xl font-bold mb-2">{selectedReg.name}</h2>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            selectedReg.status === 'pending'
                              ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'
                              : selectedReg.status === 'approved'
                              ? 'bg-green-900/30 border border-green-700 text-green-300'
                              : 'bg-red-900/30 border border-red-700 text-red-300'
                          }`}
                        >
                          {selectedReg.status === 'pending'
                            ? '⏳ Ausstehend'
                            : selectedReg.status === 'approved'
                            ? '✅ Genehmigt'
                            : '❌ Abgelehnt'}
                        </span>
                        {selectedReg.approvedBy && (
                          <span className="text-xs text-slate-400">
                            Genehmigt von: {selectedReg.approvedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Email */}
                      <div className="bg-slate-900 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <Mail size={14} /> Email
                        </p>
                        <p className="font-mono text-sm break-all">{selectedReg.email}</p>
                      </div>

                      {/* Discord */}
                      <div className="bg-slate-900 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <User size={14} /> Discord
                        </p>
                        <p className="font-bold text-indigo-400">{selectedReg.discord}</p>
                      </div>

                      {/* Discord ID ✅ */}
                      <div className="bg-slate-900 rounded-lg p-4 border border-purple-700">
                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          🔑 Discord ID
                        </p>
                        <p className="font-mono text-sm text-purple-400">
                          {selectedReg.discordId || '—'}
                        </p>
                      </div>

                      {/* GGPoker */}
                      <div className="bg-slate-900 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1">♠️ GGPoker Nickname</p>
                        <p className="font-bold text-green-400">{selectedReg.ggpokerNickname}</p>
                      </div>

                      {/* Livestream */}
                      {selectedReg.livestreamLink && (
                        <div className="bg-slate-900 rounded-lg p-4 col-span-2">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Twitch size={14} /> Livestream
                          </p>
                          <a
                            href={selectedReg.livestreamLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                          >
                            <LinkIcon size={14} /> Link öffnen
                          </a>
                        </div>
                      )}

                      {/* Datum */}
                      <div className="bg-slate-900 rounded-lg p-4 col-span-2">
                        <p className="text-xs text-slate-400 mb-1">📅 Registrierungsdatum</p>
                        <p className="text-sm">
                          {new Date(selectedReg.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedReg.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveReg(selectedReg)}
                          disabled={approvingId === selectedReg.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          {approvingId === selectedReg.id ? (
                            <>
                              <AlertCircle size={20} className="animate-pulse" />
                              Wird genehmigt...
                            </>
                          ) : (
                            <>
                              <Check size={20} />
                              ✅ Genehmigen
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectReg(selectedReg.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <X size={20} />
                          ❌ Ablehnen
                        </button>
                      </div>
                    )}

                    {selectedReg.status === 'approved' && (
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-300">
                        ✅ Diese Registrierung wurde bereits genehmigt
                      </div>
                    )}

                    {selectedReg.status === 'rejected' && (
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
                        ❌ Diese Registrierung wurde abgelehnt
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // ✅ LIST VIEW
                <div className="space-y-3">
                  {filteredRegs.length > 0 ? (
                    filteredRegs.map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1">{reg.name}</h3>
                            <p className="text-sm text-slate-400 truncate">{reg.email}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">
                                {reg.discord}
                              </span>
                              {reg.discordId && (
                                <span className="text-xs bg-purple-900/30 px-2 py-1 rounded text-purple-300 border border-purple-700 font-mono">
                                  ID: {reg.discordId}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {reg.status === 'pending' && (
                              <span className="inline-block bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                                ⏳ Ausstehend
                              </span>
                            )}
                            {reg.status === 'approved' && (
                              <span className="inline-block bg-green-900/30 border border-green-700 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                                ✅ Genehmigt
                              </span>
                            )}
                            {reg.status === 'rejected' && (
                              <span className="inline-block bg-red-900/30 border border-red-700 text-red-300 px-3 py-1 rounded-full text-xs font-bold">
                                ❌ Abgelehnt
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                      <p className="text-slate-400">
                        Keine Registrierungen in dieser Kategorie
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
                    <th className="px-6 py-4 text-left font-bold">Beweisfoto</th>
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
                      <td className="px-6 py-4 text-sm">
  {update.proofImageUrl ? (
    <div 
      onClick={() => {
        setSelectedImage(update.proofImageUrl!);
        setZoom(1);
      }}
      className="cursor-pointer hover:opacity-75 transition inline-block"
      title="Klick zum Vergrößern"
    >
      <img 
        src={update.proofImageUrl} 
        alt="Beweisfoto" 
        className="h-20 rounded border border-slate-600 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 transition object-cover"
      />
    </div>
  ) : (
    <span className="text-slate-600">-</span>
  )}
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
                                onClick={() => handleApproveBankroll(update.id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                                title="Genehmigen"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleRejectBankroll(update.id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                                title="Ablehnen"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteBankroll(update.id)}
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
            </div>  {/* <- Schließe overflow-x-auto div */}

            {/* 🖼️ IMAGE MODAL mit ZOOM */}
            {selectedImage && (
              <div 
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedImage(null)}
              >
                <div 
                  className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                    <h3 className="font-bold text-white">Beweisfoto</h3>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Image Container */}
                  <div className="p-4 flex items-center justify-center min-h-[400px]">
                    <div className="overflow-auto max-h-[60vh] relative">
                      <img
                        src={selectedImage}
                        alt="Beweisfoto"
                        className="cursor-zoom-in rounded"
                        style={{
                          transform: `scale(${zoom})`,
                          transition: "transform 0.2s ease",
                        }}
                        onClick={() => setZoom(zoom === 1 ? 1.5 : 1)}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="bg-slate-900 border-t border-slate-700 p-4 flex items-center justify-center gap-4 flex-wrap">
                    <button
                      onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                      disabled={zoom <= 1}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded flex items-center gap-2"
                    >
                      <ZoomOut size={18} />
                      Raus
                    </button>
                    
                    <span className="text-slate-300 font-bold min-w-[50px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                      disabled={zoom >= 3}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded flex items-center gap-2"
                    >
                      <ZoomIn size={18} />
                      Rein
                    </button>

                    <div className="flex-1"></div>

                    <button
                      onClick={() => setSelectedImage(null)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold"
                    >
                      ✅ Schließen
                    </button>
                 </div>
            </div>
          </div>
        )}

            {filteredBankrollUpdates.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Bankroll Updates in diesem Status
              </div>
            )}
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