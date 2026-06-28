import React, { useState, useEffect, useRef } from "react";
import { Headphones, MessageSquare, Clock, User, Mail, Send, CheckSquare, Search, AlertCircle } from "lucide-react";
import { collection, query, onSnapshot, doc, setDoc, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

interface SupportChatSession {
  id: string;
  chatId: string;
  customerName: string;
  email: string;
  status: string;
  updatedAt: string;
  lastMessageText?: string;
}

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export default function SupportManagementPanel() {
  const [sessions, setSessions] = useState<SupportChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to all active support chats sessions
  useEffect(() => {
    const q = query(
      collection(db, "support_chats"),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions: SupportChatSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedSessions.push({
            id: docSnap.id,
            chatId: data.chatId || docSnap.id,
            customerName: data.customerName || "Anonymous Guest",
            email: data.email || "",
            status: data.status || "active",
            updatedAt: data.updatedAt || new Date().toISOString(),
            lastMessageText: data.lastMessageText || "",
          });
        });
        setSessions(fetchedSessions);
        
        // Select the first session by default if none is selected
        if (fetchedSessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(fetchedSessions[0].id);
        }
        setError(null);
      },
      (err) => {
        console.error("Error reading support chats list: ", err);
        setError("Missing or insufficient permissions to query support sessions.");
      }
    );

    return () => unsubscribe();
  }, [selectedSessionId]);

  // 2. Subscribe to messages of selected support session
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "support_chats", selectedSessionId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMsgs: SupportMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedMsgs.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp,
          });
        });
        setMessages(fetchedMsgs);
        setError(null);
      },
      (err) => {
        console.error("Error subscribing to support session messages: ", err);
        setError("Unable to sync messages. Access restricted.");
      }
    );

    return () => unsubscribe();
  }, [selectedSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending || !selectedSessionId) return;

    setIsSending(true);
    setError(null);

    const messageId = "msg_reply_" + Date.now();
    const messageDocRef = doc(db, "support_chats", selectedSessionId, "messages", messageId);

    const payload = {
      senderId: "support_agent",
      senderName: "Admin Helpdesk",
      text: cleanText,
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(messageDocRef, payload);

      // Update parent ticket metadata
      const chatDocRef = doc(db, "support_chats", selectedSessionId);
      await setDoc(
        chatDocRef,
        {
          updatedAt: new Date().toISOString(),
          lastMessageText: cleanText,
          status: "active",
        },
        { merge: true }
      );

      setInputText("");
    } catch (err) {
      console.error("Error sending helpdesk reply: ", err);
      setError("Reply failed. Security constraints block this write.");
    } finally {
      setIsSending(false);
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "closed" : "active";
      const docRef = doc(db, "support_chats", sessionId);
      await setDoc(docRef, { status: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Error toggling support chat status:", err);
      setError("Failed to update ticket status.");
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.customerName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.lastMessageText || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="support-management-panel">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
            <Headphones className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Support Desk & Live Guest Assistance</span>
          </h2>
          <p className="text-[10px] text-neutral-400 font-sans leading-relaxed mt-1">
            Review real-time assistance inquiries, coordinate custom menu questions, and type direct chat replies using Firestore live sync.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filter sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 font-sans text-xs p-2.5 pl-9 w-full md:w-64 text-white focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-500 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left sidebar, Right active panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Sidebar: Inquiries List */}
        <div className="lg:col-span-4 border border-neutral-800 bg-[#161616] flex flex-col h-[500px] overflow-hidden">
          <div className="p-3 bg-neutral-900 border-b border-neutral-800 font-mono text-[9px] tracking-wider uppercase text-neutral-400 font-bold">
            Assistance Tickets ({filteredSessions.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-850">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-neutral-600 font-sans space-y-2 mt-12">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-neutral-600" />
                <p className="text-xs font-mono uppercase tracking-wider">No tickets found</p>
                <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[180px] mx-auto">
                  No support sessions match your search or have been registered yet.
                </p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === selectedSessionId;
                const isClosed = s.status === "closed";
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-left p-4 transition-all block ${
                      isActive
                        ? "bg-neutral-850 border-l-2 border-amber-500"
                        : "hover:bg-neutral-850/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-neutral-200 line-clamp-1">{s.customerName}</h4>
                      <span
                        className={`px-1.5 py-0.5 text-[8px] font-mono uppercase font-bold tracking-wider shrink-0 ${
                          isClosed
                            ? "bg-neutral-800 text-neutral-500 border border-neutral-700"
                            : "bg-emerald-950/40 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 font-mono mt-1">
                      <Mail className="w-3 h-3 text-neutral-600" />
                      <span className="truncate">{s.email}</span>
                    </div>

                    {s.lastMessageText && (
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-2 bg-neutral-950/40 p-1.5 px-2 border border-neutral-850 font-sans leading-relaxed">
                        {s.lastMessageText}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-[8px] text-neutral-500 font-mono mt-2.5">
                      <Clock className="w-3 h-3" />
                      <span>Updated: {new Date(s.updatedAt).toLocaleString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Chat panel */}
        <div className="lg:col-span-8 border border-neutral-800 bg-[#141414] flex flex-col h-[500px] overflow-hidden">
          {selectedSession ? (
            <div className="flex-grow flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-mono font-bold text-amber-500 uppercase">
                      Active: {selectedSession.customerName}
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-mono">({selectedSession.email})</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                    TICKET ID: {selectedSession.chatId}
                  </p>
                </div>

                <button
                  onClick={() => toggleSessionStatus(selectedSession.id, selectedSession.status)}
                  className={`px-3 py-1.5 border font-mono text-[9px] tracking-wider uppercase font-bold cursor-pointer transition-all ${
                    selectedSession.status === "closed"
                      ? "bg-emerald-950/35 text-emerald-400 border-emerald-800 hover:bg-emerald-950/60"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  {selectedSession.status === "closed" ? "Reopen Ticket" : "Mark as Closed"}
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#181818] scrollbar-thin scrollbar-thumb-neutral-850">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 font-sans p-6 text-center space-y-2">
                    <Clock className="w-8 h-8 opacity-40 animate-spin" />
                    <p className="text-xs font-mono uppercase tracking-wider">Syncing communication logs...</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId !== "customer";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isSelf ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <span className="text-[8px] font-mono tracking-wider text-neutral-500 uppercase mb-0.5">
                          {msg.senderName} ({msg.senderId})
                        </span>
                        <div
                          className={`p-3 text-xs leading-relaxed ${
                            isSelf
                              ? "bg-amber-600 text-black font-semibold rounded-[12px_12px_2px_12px]"
                              : "bg-neutral-800 text-neutral-100 rounded-[12px_12px_12px_2px]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 opacity-40">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[7.5px] font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-850 bg-neutral-900 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Send secure reply to ${selectedSession.customerName}...`}
                  className="flex-grow bg-neutral-950 border border-neutral-800 font-sans text-xs p-3 focus:outline-none focus:border-amber-500 text-white"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-55">
              <Headphones className="w-12 h-12 text-neutral-600" />
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold">
                  No Support Session Selected
                </p>
                <p className="text-[10px] text-neutral-400 font-sans max-w-[280px] leading-relaxed">
                  Choose a help-desk inquiry card from the left panel to display live transcripts and respond.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
