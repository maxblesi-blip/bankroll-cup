"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader, Send, Image as ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

export default function TicketChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!ticketId || !session?.user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", ticketId)
          .single();

        if (ticketError) throw ticketError;
        setTicket(ticketData);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("ticket_messages")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Fehler beim Laden des Tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticketId, session?.user]);

  // Real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    const messagesSubscription = supabase
      .from("ticket_messages")
      .on("*", (payload) => {
        if (payload.eventType === "INSERT") {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      })
      .subscribe();

    const ticketSubscription = supabase
      .from("tickets")
      .on("UPDATE", (payload) => {
        setTicket(payload.new as Ticket);
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      ticketSubscription.unsubscribe();
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(",")[1] || "";
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const response = await fetch("/api/tickets/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          ticketId,
          user_id: (session?.user as any).id,
        }),
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Fehler beim Hochladen des Bildes");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) return;
    if (!messageText.trim() && !selectedImage) return;

    setSendingMessage(true);

    try {
      const user = session.user as any;
      let imageUrl = null;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        setSelectedImage(null);
        setImagePreview(null);
      }

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role || "user",
          message: messageText.trim(),
          image_url: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Fehler beim Senden der Nachricht");
    } finally {
      setSendingMessage(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-400 font-bold">Bitte melde dich an</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-purple-400" />
          <p className="text-slate-300">Ticket wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-400">Ticket nicht gefunden</p>
          <Link href="/help/tickets" className="text-blue-400 hover:underline mt-2 block">
            Zurück zu Tickets
          </Link>
        </div>
      </div>
    );
  }

  const user = session.user as any;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Link href="/help/tickets" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
            ← Zurück zu Tickets
          </Link>
          <h1 className="text-4xl font-bold">{ticket.title}</h1>
          <p className="text-slate-400 mt-1">#{ticket.id.substring(0, 8)}</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400 mb-1">Status</p>
          <p className="text-lg font-bold">
            {ticket.status === "open" && "🟢 Offen"}
            {ticket.status === "in_progress" && "🟡 In Bearbeitung"}
            {ticket.status === "resolved" && "✅ Gelöst"}
            {ticket.status === "closed" && "🔴 Geschlossen"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Kategorie</p>
          <p className="font-bold text-white">{ticket.category}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Priorität</p>
          <p className="font-bold">
            {ticket.priority === "high" && <span className="text-red-400">⚠️ Hoch</span>}
            {ticket.priority === "medium" && <span className="text-orange-400">📌 Mittel</span>}
            {ticket.priority === "low" && <span className="text-green-400">➡️ Niedrig</span>}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Erstellt</p>
          <p className="font-bold text-white">
            {new Date(ticket.created_at).toLocaleDateString("de-DE")}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Von</p>
          <p className="font-bold text-white">{ticket.user_name}</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col" style={{ height: "500px" }}>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>Noch keine Nachrichten</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.user_id === user.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs ${
                    msg.user_id === user.id
                      ? "bg-purple-600/30 border border-purple-500"
                      : msg.user_role === "admin" || msg.user_role === "mod"
                      ? "bg-blue-600/30 border border-blue-500"
                      : "bg-slate-700 border border-slate-600"
                  } rounded-lg p-4`}
                >
                  <p className="text-sm text-slate-300 mb-1">
                    {msg.user_name}
                    {msg.user_role !== "user" && (
                      <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded">
                        {msg.user_role === "admin" ? "👑 Admin" : "🔧 Mod"}
                      </span>
                    )}
                  </p>

                  {msg.image_url && (
                    <div className="mb-2">
                      <img
                        src={msg.image_url}
                        alt="Uploaded image"
                        className="max-w-xs rounded cursor-pointer hover:opacity-80"
                        onClick={() => window.open(msg.image_url, "_blank")}
                      />
                    </div>
                  )}

                  <p className="text-white">{msg.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(msg.created_at).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-slate-700 p-4 space-y-3">
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-24 rounded" />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Schreib eine Nachricht..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 outline-none"
              disabled={sendingMessage || uploadingImage}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMessage || uploadingImage}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white p-2 rounded transition"
              title="Bild hochladen"
            >
              <ImageIcon size={20} />
            </button>

            <button
              type="submit"
              disabled={sendingMessage || uploadingImage || (!messageText.trim() && !selectedImage)}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white px-4 py-2 rounded transition flex items-center gap-2"
            >
              {sendingMessage || uploadingImage ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}