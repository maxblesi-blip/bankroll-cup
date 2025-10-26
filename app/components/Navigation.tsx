"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, X } from "lucide-react";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();
  const isUnauthorized = pathname === "/unauthorized";
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [isInLeaderboard, setIsInLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ NICHT rendern wenn /unauthorized
  if (isUnauthorized) {
    return null;
  }

  const user = session?.user as any;
  
  // ... Rest des Codes bleibt gleich ...

  // ✅ Lade Leaderboard und prüfe ob User darin ist
  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const checkLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        
        // ✅ PRIMÄR: Prüfe Discord ID
        // Fallback: Prüfe Email (für ältere Einträge)
        const found = data.players?.some(
          (p: any) => 
            (user.discordId && p.discordId === user.discordId) ||
            (p.email?.toLowerCase() === user.email?.toLowerCase())
        );
        
        setIsInLeaderboard(!!found);
      } catch (error) {
        console.error("Fehler beim Laden Leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLeaderboard();
  }, [user?.email]);

  // ✅ Schließe Menü wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-purple-400 hover:text-purple-300"
        >
           MP Bankroll Cup
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 items-center">
          <Link
            href="/livestreams"
            className="text-slate-300 hover:text-purple-400 transition font-bold"
          >
            📺 Streams
          </Link>
          <Link
            href="/ranking"
            className="text-slate-300 hover:text-purple-400 transition font-bold"
          >
            📊 Rangliste
          </Link>
          <Link
            href="/regeln"
            className="text-slate-300 hover:text-purple-400 transition font-bold"
          >
            📋 Regeln
          </Link>
          
          {/* ✅ ANMELDUNG - nur anzeigen wenn NOT im Leaderboard */}
          {!isInLeaderboard && !loading && (
            <Link
              href="/anmeldung"
              className="text-slate-300 hover:text-purple-400 transition font-bold"
            >
              📝 Anmeldung
            </Link>
          )}

          {/* User Auth */}
          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-bold transition"
              >
                <Menu size={20} />
                {user?.name || "Benutzer"}
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-48 overflow-hidden">
                  {/* Close Button */}
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                    <p className="text-sm text-slate-400">Menü</p>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="text-slate-400 hover:text-white transition"
                      title="Schließen"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Profile Info */}
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-900">
                    <p className="text-sm text-slate-400">Angemeldet als</p>
                    <p className="font-bold text-white">{user?.name}</p>
                  </div>

                  {/* Bankroll Update Link - nur für player, mod, admin UND im Leaderboard */}
                  {isInLeaderboard && 
                    (user?.role === "player" || user?.role === "mod" || user?.role === "admin") && (
                    <button
                      onClick={() => {
                        window.location.href = "/bankroll-update";
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-blue-400 border-b border-slate-700 font-bold"
                    >
                      💰 Bankroll aktualisieren
                    </button>
                  )}

                  {/* Dashboard Link - nur wenn Admin/Mod/Player */}
                  {(user?.role === "admin" || user?.role === "mod" || user?.role === "player") && (
                    <button
                      onClick={() => {
                        window.location.href = "/dashboard";
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-blue-400 border-b border-slate-700 font-bold"
                    >
                      📊 Dashboard
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-400 flex items-center gap-2 font-bold"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signup"
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-bold transition"
            >
              Anmelden
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {session ? (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg"
            >
              {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          ) : (
            <Link
              href="/signup"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm"
            >
              Anmelden
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && session && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 p-4">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
            <p className="font-bold text-slate-300">Menü</p>
            <button
              onClick={() => setShowMenu(false)}
              className="text-slate-400 hover:text-white transition"
              title="Schließen"
            >
              <X size={20} />
            </button>
          </div>

          <Link
            href="/livestreams"
            onClick={() => setShowMenu(false)}
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📺 Streams
          </Link>
          <Link
            href="/ranking"
            onClick={() => setShowMenu(false)}
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📊 Rangliste
          </Link>
          <Link
            href="/regeln"
            onClick={() => setShowMenu(false)}
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📋 Regeln
          </Link>
          
          {/* ✅ ANMELDUNG Mobile - nur anzeigen wenn NOT im Leaderboard */}
          {!isInLeaderboard && !loading && (
            <Link
              href="/anmeldung"
              onClick={() => setShowMenu(false)}
              className="block text-slate-300 hover:text-purple-400 py-2 font-bold border-b border-slate-700 mb-2 pb-2"
            >
              📝 Anmeldung
            </Link>
          )}

          {/* Mobile Bankroll Update - nur für player, mod, admin UND im Leaderboard */}
          {isInLeaderboard && 
            (user?.role === "player" || user?.role === "mod" || user?.role === "admin") && (
            <Link
              href="/bankroll-update"
              onClick={() => setShowMenu(false)}
              className="block text-blue-400 hover:text-blue-300 py-2 font-bold border-b border-slate-700 mb-2"
            >
              💰 Bankroll aktualisieren
            </Link>
          )}

          {/* Mobile Dashboard Link - nur für player, mod, admin */}
          {(user?.role === "admin" || user?.role === "mod" || user?.role === "player") && (
            <Link
              href="/dashboard"
              onClick={() => setShowMenu(false)}
              className="block text-blue-400 py-2 font-bold border-b border-slate-700 mb-2"
            >
              📊 Dashboard
            </Link>
          )}

          <button
            onClick={() => {
              signOut();
              setShowMenu(false);
            }}
            className="block w-full text-left text-red-400 py-2 font-bold mt-2 pt-2 border-t border-slate-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}