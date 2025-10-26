'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Edit2,
  X,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface BankrollUpdate {
  id: string;
  userId: string;
  userName: string;
  discordId?: string;
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
  discordUsername?: string;
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

      const playersResponse = await fetch('/api/leaderboard');
      const playersData = await playersResponse.json();

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
          discordUsername: p.discordUsername || '',
        }));
        setPlayers(convertedPlayers);
      } else {
        setPlayers([]);
      }

      const regsResponse = await fetch('/api/registrations');
      const regsData = await regsResponse.json();
      setRegistrations(regsData || []);

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
      const response = await fetch('/api/leaderboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });

      if (response.ok) {
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
        alert('❌ Fehler beim Speichern!');
      }
    } catch (error) {
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
        const response = await fetch('/api/leaderboard', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: player.id,
            email: player.email,
          }),
        });

        if (response.ok) {
          setPlayers(players.filter((p) => p.email !== player.email));
          alert('✅ Spieler gelöscht!');
        } else {
          alert('❌ Fehler beim Löschen!');
        }
      } catch (error) {
        alert('❌ Fehler beim Löschen!');
      }
    }
  };

  const handleApproveReg = async (reg: Registration) => {
    try {
      setApprovingId(reg.id);
      const user = session?.user as any;

      const response = await fetch('/api/registrations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          approvedBy: user?.name || user?.email,
        }),
      });

      if (response.ok) {
        setRegistrations(
          registrations.map((r) =>
            r.id === reg.id ? { ...r, status: 'approved' } : r
          )
        );
        setSelectedReg(null);
        alert('✅ Registrierung genehmigt!');
      } else {
        alert('❌ Fehler beim Genehmigen!');
      }
    } catch (error) {
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

  const handleApproveBankroll = async (updateId: string) => {
    try {
      const update = bankrollUpdates.find((u) => u.id === updateId);
      if (!update) return;

      const response = await fetch('/api/bankroll-updates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updateId, status: 'approved' }),
      });

      if (response.ok) {
        await fetch('/api/leaderboard', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discordId: update.discordId,
            email: update.userId,
            name: update.userName,
            bankroll: update.bankroll,
          }),
        });

        setBankrollUpdates(
          bankrollUpdates.map((u) =>
            u.id === updateId ? { ...u, status: 'approved' as const } : u
          )
        );
        loadData();
      }
    } catch (error) {
      console.error('Error approving bankroll:', error);
    }
  };

  const handleRejectBankroll = async (bankrollId: string) => {
    try {
      const response = await fetch(`/api/bankroll-updates/${bankrollId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectedBy: session?.user?.name || 'Admin',
        }),
      });

      if (response.ok) {
        setBankrollUpdates(
          bankrollUpdates.map((u) =>
            u.id === bankrollId ? { ...u, status: 'rejected' as const } : u
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting bankroll:', error);
    }
  };

  const handleDeleteBankroll = async (bankrollId: string) => {
    if (confirm('Update wirklich löschen?')) {
      try {
        const response = await fetch('/api/bankroll-updates', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bankrollId }),
        });

        if (response.ok) {
          setBankrollUpdates(bankrollUpdates.filter((u) => u.id !== bankrollId));
          alert('✅ Update gelöscht!');
        }
      } catch (error) {
        alert('❌ Fehler beim Löschen!');
      }
    }
  };

  const filteredBankrollUpdates = bankrollUpdates.filter(
    (u) => u.status === bankrollFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <p>Wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold mb-6">🎛️ Admin Panel</h1>

        {/* TABS - Responsive */}
        <div className="flex gap-1 md:gap-4 mb-6 border-b border-slate-700 pb-4 flex-wrap">
          {['members', 'registrations', 'bankroll'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-2 md:px-4 py-2 text-xs md:text-base font-bold transition whitespace-nowrap ${
                tab === t
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t === 'members' && '👥 Mitglieder'}
              {t === 'registrations' && '📝 Anmeldungen'}
              {t === 'bankroll' && '💰 Bankroll'}
            </button>
          ))}
        </div>

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold">Mitglieder verwalten</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Plus size={18} />
                Neues Mitglied
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700">
                      <th className="px-4 py-3 text-left font-bold">Name</th>
                      <th className="px-4 py-3 text-left font-bold">Discord</th>
                      <th className="px-4 py-3 text-left font-bold">GGPoker</th>
                      <th className="px-4 py-3 text-right font-bold">Bankroll</th>
                      <th className="px-4 py-3 text-left font-bold">Stream</th>
                      <th className="px-4 py-3 text-center font-bold">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) =>
                      editingId === player.id && editData ? (
                        <tr key={player.id} className="border-b border-slate-700 bg-slate-700/50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({ ...editData, name: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {editData.discordUsername} / {editData.discordId}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editData.ggpokerNickname}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  ggpokerNickname: e.target.value,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editData.bankroll}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  bankroll: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {editData.livestreamLink ? (
                              <a 
                                href={editData.livestreamLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 hover:underline"
                              >
                                Link 🔗
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded text-xs"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="bg-slate-600 hover:bg-slate-700 text-white p-1.5 rounded text-xs"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={player.id}
                          className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                        >
                          <td className="px-4 py-3 font-bold">{player.name}</td>
                          <td className="px-4 py-3 text-xs">
                            <div className="text-slate-300 font-bold">{player.discordUsername || '-'}</div>
                            <div className="text-slate-500">{player.discordId || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {player.ggpokerNickname}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-400">
                            €{player.bankroll}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {player.livestreamLink ? (
                              <a 
                                href={player.livestreamLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 hover:underline font-bold"
                              >
                                Link 🔗
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleEdit(player)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded text-xs"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player)}
                                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded text-xs"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {players.map((player) =>
                editingId === player.id && editData ? (
                  <div key={player.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="GGPoker"
                      value={editData.ggpokerNickname}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          ggpokerNickname: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Bankroll"
                      value={editData.bankroll}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          bankroll: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold text-sm"
                      >
                        ✅ Speichern
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded font-bold text-sm"
                      >
                        ❌ Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={player.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold">{player.name}</h3>
                        <p className="text-xs text-slate-400">{player.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Bankroll</p>
                        <p className="font-bold text-green-400">€{player.bankroll}</p>
                      </div>
                    </div>
                    <div className="mb-3 pb-3 border-b border-slate-700 space-y-2">
                      <div>
                        <p className="text-xs text-slate-400">Discord</p>
                        <p className="text-sm font-bold">{player.discordUsername || '-'}</p>
                        <p className="text-xs text-slate-500">{player.discordId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">GGPoker</p>
                        <p className="text-sm">{player.ggpokerNickname}</p>
                      </div>
                      {player.livestreamLink && (
                        <div>
                          <p className="text-xs text-slate-400">Livestream</p>
                          <a 
                            href={player.livestreamLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-400 hover:text-purple-300 hover:underline font-bold"
                          >
                            Link 🔗
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(player)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold text-sm"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold text-sm"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {players.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Mitglieder vorhanden
              </div>
            )}
          </>
        )}

        {/* REGISTRATIONS TAB */}
        {tab === 'registrations' && (
          <>
            <h2 className="text-xl md:text-2xl font-bold mb-6">Anmeldungen verwalten</h2>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 md:p-4 mb-6 flex flex-wrap gap-2 md:gap-3">
              {['pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setRegFilter(status as any)}
                  className={`px-2 md:px-4 py-2 text-xs md:text-base rounded font-bold transition ${
                    regFilter === status
                      ? status === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : status === 'approved'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {status === 'pending' && `⏳ (${registrations.filter((r) => r.status === 'pending').length})`}
                  {status === 'approved' && `✅ (${registrations.filter((r) => r.status === 'approved').length})`}
                  {status === 'rejected' && `❌ (${registrations.filter((r) => r.status === 'rejected').length})`}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {registrations
                .filter((r) => r.status === regFilter)
                .map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedReg(selectedReg?.id === reg.id ? null : reg)}
                    className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{reg.name}</h3>
                        <p className="text-sm text-slate-400 truncate">{reg.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                          reg.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' :
                          reg.status === 'approved' ? 'bg-green-900/30 text-green-300' :
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {reg.status === 'pending' ? '⏳' : reg.status === 'approved' ? '✅' : '❌'}
                        </span>
                        <ChevronDown size={16} className={`transition ${selectedReg?.id === reg.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {selectedReg?.id === reg.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-slate-400">GGPoker</p>
                            <p className="font-bold">{reg.ggpokerNickname}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Bankroll</p>
                            <p className="font-bold text-green-400">€{reg.bankroll}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Discord</p>
                            <p className="font-bold">{reg.discord}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Erfahrung</p>
                            <p className="font-bold capitalize">{reg.experience}</p>
                          </div>
                        </div>

                        {reg.livestreamLink && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Stream Link</p>
                            <a href={reg.livestreamLink} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-purple-400 break-all hover:text-purple-300">
                              {reg.livestreamLink}
                            </a>
                          </div>
                        )}
                        
                        {reg.status === 'pending' && (
                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveReg(reg);
                              }}
                              disabled={approvingId === reg.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-2 rounded font-bold text-sm"
                            >
                              {approvingId === reg.id ? 'Wird genehmigt...' : '✅ Genehmigen'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectReg(reg.id);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold text-sm"
                            >
                              ❌ Ablehnen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </>
        )}

        {/* BANKROLL TAB */}
        {tab === 'bankroll' && (
          <>
            <h2 className="text-xl md:text-2xl font-bold mb-6">Bankroll Updates</h2>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 md:p-4 mb-6 flex flex-wrap gap-2 md:gap-3">
              {['pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setBankrollFilter(status as any)}
                  className={`px-2 md:px-4 py-2 text-xs md:text-base rounded font-bold transition ${
                    bankrollFilter === status
                      ? status === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : status === 'approved'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {status === 'pending' && `⏳ (${bankrollUpdates.filter((u) => u.status === 'pending').length})`}
                  {status === 'approved' && `✅ (${bankrollUpdates.filter((u) => u.status === 'approved').length})`}
                  {status === 'rejected' && `❌ (${bankrollUpdates.filter((u) => u.status === 'rejected').length})`}
                </button>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700">
                      <th className="px-4 py-3 text-left font-bold">Spieler</th>
                      <th className="px-4 py-3 text-right font-bold">€</th>
                      <th className="px-4 py-3 text-left font-bold">Foto</th>
                      <th className="px-4 py-3 text-left font-bold">Notizen</th>
                      <th className="px-4 py-3 text-left font-bold">Status</th>
                      <th className="px-4 py-3 text-left font-bold">Datum</th>
                      <th className="px-4 py-3 text-center font-bold">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBankrollUpdates.map((update) => (
                      <tr key={update.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="px-4 py-3 font-bold">{update.userName}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-400">€{update.bankroll}</td>
                        <td className="px-4 py-3">
                          {update.proofImageUrl ? (
                            <div 
                              onClick={() => {
                                setSelectedImage(update.proofImageUrl!);
                                setZoom(1);
                              }}
                              className="cursor-pointer inline-block"
                            >
                              <img 
                                src={update.proofImageUrl} 
                                alt="Foto"
                                className="h-12 rounded border border-slate-600 hover:border-purple-400"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                          {update.notes || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            update.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                            update.status === 'approved' ? 'bg-green-900 text-green-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {update.status === 'pending' ? '⏳' : update.status === 'approved' ? '✅' : '❌'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(update.createdAt).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            {update.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveBankroll(update.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded text-xs"
                                  title="Genehmigen"
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={() => handleRejectBankroll(update.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded text-xs"
                                  title="Ablehnen"
                                >
                                  ❌
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteBankroll(update.id)}
                              className="bg-slate-600 hover:bg-slate-700 text-white p-1.5 rounded text-xs"
                              title="Löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredBankrollUpdates.map((update) => (
                <div key={update.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-bold">{update.userName}</h3>
                      <p className="text-xs text-slate-400">{new Date(update.createdAt).toLocaleDateString('de-DE')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                      update.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      update.status === 'approved' ? 'bg-green-900 text-green-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {update.status === 'pending' ? '⏳ Ausstehend' : update.status === 'approved' ? '✅ Genehmigt' : '❌ Abgelehnt'}
                    </span>
                  </div>

                  {update.proofImageUrl && (
                    <div className="mb-3 pb-3 border-b border-slate-700">
                      <div 
                        onClick={() => {
                          setSelectedImage(update.proofImageUrl!);
                          setZoom(1);
                        }}
                        className="cursor-pointer inline-block"
                      >
                        <img 
                          src={update.proofImageUrl} 
                          alt="Beweisfoto"
                          className="h-32 rounded border border-slate-600 hover:border-purple-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-xs text-slate-400">Bankroll</p>
                    <p className="text-lg font-bold text-green-400">€{update.bankroll}</p>
                  </div>

                  {update.notes && (
                    <div className="mb-3 pb-3 border-b border-slate-700">
                      <p className="text-xs text-slate-400">Notizen</p>
                      <p className="text-sm">{update.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {update.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveBankroll(update.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold text-sm"
                        >
                          ✅ Genehmigen
                        </button>
                        <button
                          onClick={() => handleRejectBankroll(update.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold text-sm"
                        >
                          ❌ Ablehnen
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteBankroll(update.id)}
                      className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 rounded font-bold text-sm"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredBankrollUpdates.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Keine Updates in diesem Status
              </div>
            )}
          </>
        )}

        {/* IMAGE MODAL */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-3 md:p-4 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm md:text-base">Beweisfoto</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                <div className="overflow-auto max-h-[50vh] md:max-h-[60vh] relative">
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

              <div className="bg-slate-900 border-t border-slate-700 p-3 md:p-4 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                  disabled={zoom <= 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-2 rounded text-xs md:text-sm"
                >
                  <ZoomOut size={16} />
                </button>
                
                <span className="text-slate-300 font-bold text-xs md:text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                  disabled={zoom >= 3}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-2 rounded text-xs md:text-sm"
                >
                  <ZoomIn size={16} />
                </button>

                <div className="flex-1"></div>

                <button
                  onClick={() => setSelectedImage(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded font-bold text-xs md:text-sm"
                >
                  ✅ Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl md:text-2xl font-bold mb-4">Neues Mitglied</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newPlayer.name}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newPlayer.email}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="GGPoker Nickname"
                  value={newPlayer.ggpokerNickname}
                  onChange={(e) =>
                    setNewPlayer({
                      ...newPlayer,
                      ggpokerNickname: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Startbankroll"
                  value={newPlayer.bankroll}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, bankroll: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:border-purple-500 outline-none text-sm"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAddPlayer}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold text-sm"
                >
                  Hinzufügen
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}