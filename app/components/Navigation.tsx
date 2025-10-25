"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, X } from "lucide-react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  const user = session?.user as any;

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
          <Link
            href="/anmeldung"
            className="text-slate-300 hover:text-purple-400 transition font-bold"
          >
            📝 Anmeldung
          </Link>

          {/* User Auth */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-bold transition"
              >
                <Menu size={20} />
                {user?.name || "Benutzer"}
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-48 overflow-hidden">
                  {/* Profile Info */}
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-900">
                    <p className="text-sm text-slate-400">Angemeldet als</p>
                    <p className="font-bold text-white">{user?.name}</p>
                  </div>

                  {/* Bankroll Update Link */}
                  <button
                    onClick={() => {
                      window.location.href = "/bankroll-update";
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-blue-400 border-b border-slate-700 font-bold"
                  >
                    💰 Bankroll aktualisieren
                  </button>

                  {/* Admin Link - nur wenn Admin/Mod */}
                  {(user?.role === "admin" || user?.role === "mod") && (
                    <button
                      onClick={() => {
                        window.location.href = "/admin";
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-purple-400 border-b border-slate-700 font-bold"
                    >
                      ⚙️ Admin
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
          <Link
            href="/livestreams"
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📺 Streams
          </Link>
          <Link
            href="/ranking"
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📊 Rangliste
          </Link>
          <Link
            href="/regeln"
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold"
          >
            📋 Regeln
          </Link>
          <Link
            href="/anmeldung"
            className="block text-slate-300 hover:text-purple-400 py-2 font-bold border-b border-slate-700 mb-2 pb-2"
          >
            📝 Anmeldung
          </Link>

          {/* Mobile Bankroll Update */}
          <Link
            href="/bankroll-update"
            className="block text-blue-400 hover:text-blue-300 py-2 font-bold border-b border-slate-700 mb-2"
          >
            💰 Bankroll aktualisieren
          </Link>

          {/* Mobile Admin Link */}
          {(user?.role === "admin" || user?.role === "mod") && (
            <Link
              href="/admin"
              className="block text-purple-400 py-2 font-bold border-b border-slate-700 mb-2"
            >
              ⚙️ Admin
            </Link>
          )}

          <button
            onClick={() => signOut()}
            className="block w-full text-left text-red-400 py-2 font-bold mt-2 pt-2 border-t border-slate-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}