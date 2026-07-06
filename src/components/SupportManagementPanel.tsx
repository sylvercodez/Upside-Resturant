import React, { useState, useEffect, useRef } from "react";
import { Headphones, MessageSquare, Clock, User, Mail, Send, CheckSquare, Search, AlertCircle, Settings, Bot, Sparkles, Check, Save } from "lucide-react";
import { collection, query, onSnapshot, doc, setDoc, getDoc, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { socket } from "../socket";

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

  // Support Integration settings states
  const [showConfig, setShowConfig] = useState(false);
  const [tawkEnabled, setTawkEnabled] = useState(false);
  const [tawkPropertyId, setTawkPropertyId] = useState("");
  const [tawkWidgetId, setTawkWidgetId] = useState("");
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotName, setChatbotName] = useState("Upside Smart Assistant");
  const [chatbotWelcome, setChatbotWelcome] = useState("Hello! Welcome to Upside Restaurant & Café. Ask me anything about our menu, delivery fees, or helpdesk requests!");
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial support integration config on mount
  useEffect(() => {
    const loadSupportConfig = async () => {
      try {
        const docRef = doc(db, "settings", "support_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTawkEnabled(data.tawkEnabled ?? false);
          setTawkPropertyId(data.tawkPropertyId ?? "");
          setTawkWidgetId(data.tawkWidgetId ?? "");
          setChatbotEnabled(data.chatbotEnabled ?? true);
          setChatbotName(data.chatbotName ?? "Upside Smart Assistant");
          setChatbotWelcome(data.chatbotWelcome ?? "Hello! Welcome to Upside Restaurant & Café. Ask me anything about our menu, delivery fees, or helpdesk requests!");
        }
      } catch (err) {
        console.error("Error loading support config inside admin desk:", err);
      }
    };
    loadSupportConfig();
  }, []);

  const handleSaveSupportConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    setConfigSuccess("");
    setError(null);

    try {
      const docRef = doc(db, "settings", "support_config");
      await setDoc(docRef, {
        tawkEnabled,
        tawkPropertyId: tawkPropertyId.trim(),
        tawkWidgetId: tawkWidgetId.trim(),
        chatbotEnabled,
        chatbotName: chatbotName.trim(),
        chatbotWelcome: chatbotWelcome.trim(),
        updatedAt: new Date().toISOString()
      });
      
      setConfigSuccess("Support integration settings saved successfully!");
      setTimeout(() => setConfigSuccess(""), 4000);
    } catch (err: any) {
      console.error("Error saving support config:", err);
      setError("Failed to save support integration settings: " + err.message);
    } finally {
      setIsConfigSaving(false);
    }
  };

  const safeGetDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (typeof timestamp === "object") {
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate();
      }
      if (typeof timestamp.seconds === "number") {
        return new Date(timestamp.seconds * 1000);
      }
    }
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      if (typeof timestamp === "string" && /^\d+$/.test(timestamp)) {
        return new Date(parseInt(timestamp, 10));
      }
      return new Date();
    }
    return d;
  };

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

  // 2. Subscribe to messages of selected support session and join Socket.IO room
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    // Join Socket.IO support room
    socket.emit("join-room", `support_${selectedSessionId}`);

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
        setMessages((prev) => {
          // Merge to prevent duplicates and keep chronological order
          const merged = [...prev];
          fetchedMsgs.forEach((msg) => {
            if (!merged.some((m) => m.id === msg.id)) {
              merged.push(msg);
            }
          });
          return merged.sort((a, b) => safeGetDate(a.timestamp).getTime() - safeGetDate(b.timestamp).getTime());
        });
        setError(null);
      },
      (err) => {
        console.error("Error subscribing to support session messages: ", err);
        setError("Unable to sync messages. Access restricted.");
      }
    );

    // Listen to real-time Socket.IO support messages
    const handleIncomingSupportMsg = (data: any) => {
      if (data.sessionId === selectedSessionId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          const updated = [...prev, {
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp
          }];
          return updated.sort((a, b) => safeGetDate(a.timestamp).getTime() - safeGetDate(b.timestamp).getTime());
        });
      }
    };

    socket.on("support-message", handleIncomingSupportMsg);

    return () => {
      unsubscribe();
      socket.off("support-message", handleIncomingSupportMsg);
    };
  }, [selectedSessionId]);

  // Scroll to bottom on new messages (internal container scroll only - prevents screen-scrolling jumps!)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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
      id: messageId,
      sessionId: selectedSessionId,
      senderId: "support_agent",
      senderName: "Admin Helpdesk",
      text: cleanText,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update the UI instantly
    setMessages((prev) => {
      if (prev.some((m) => m.id === messageId)) return prev;
      return [...prev, {
        id: payload.id,
        senderId: payload.senderId,
        senderName: payload.senderName,
        text: payload.text,
        timestamp: payload.timestamp
      }].sort((a, b) => safeGetDate(a.timestamp).getTime() - safeGetDate(b.timestamp).getTime());
    });
    setInputText("");

    // Dispatch via Socket.IO instantly
    socket.emit("support-message", payload);

    try {
      await setDoc(messageDocRef, {
        senderId: payload.senderId,
        senderName: payload.senderName,
        text: payload.text,
        timestamp: payload.timestamp
      });

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
        
        {/* Search bar & Settings toggle button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>Integrations Config</span>
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 font-sans text-xs p-2.5 pl-9 w-full md:w-56 text-white focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {showConfig && (
        <div className="bg-black/40 border border-neutral-800 p-5 space-y-5 animate-fadeIn rounded-lg text-left">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-mono font-black uppercase text-white tracking-widest">
                Support Channels & AI Automation Configuration
              </h3>
            </div>
            <button
              onClick={() => setShowConfig(false)}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 font-bold uppercase transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

          {configSuccess && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-mono rounded">
              ✓ {configSuccess}
            </div>
          )}

          <form onSubmit={handleSaveSupportConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Tawk.to configuration */}
            <div className="space-y-4 p-4 bg-[#141414] border border-neutral-850 rounded">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">💬</span>
                  <label className="text-neutral-200 font-bold uppercase text-[10px] tracking-wider font-mono">
                    Tawk.to Live Chat Integration
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setTawkEnabled(!tawkEnabled)}
                  className={`px-2 py-1 font-mono text-[9px] uppercase font-bold rounded cursor-pointer ${
                    tawkEnabled
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                  }`}
                >
                  {tawkEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <p className="text-[9.5px] text-neutral-400 leading-normal font-sans">
                Tawk.to provides live human support. When enabled, it replaces our default web helpdesk socket chat widget.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-neutral-500 uppercase text-[9px] font-bold block">Tawk.to Property ID</span>
                  <input
                    type="text"
                    value={tawkPropertyId}
                    onChange={(e) => setTawkPropertyId(e.target.value)}
                    disabled={!tawkEnabled}
                    placeholder="e.g. 6422f99a31ebfa0fe7f551b9"
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-[11px] p-2.5 focus:border-amber-500 outline-none rounded disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-500 uppercase text-[9px] font-bold block">Tawk.to Widget ID</span>
                  <input
                    type="text"
                    value={tawkWidgetId}
                    onChange={(e) => setTawkWidgetId(e.target.value)}
                    disabled={!tawkEnabled}
                    placeholder="e.g. 1gshn1o4s or 'default'"
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-[11px] p-2.5 focus:border-amber-500 outline-none rounded disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* Right: AI Chatbot configuration */}
            <div className="space-y-4 p-4 bg-[#141414] border border-neutral-850 rounded">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-500 animate-pulse" />
                  <label className="text-neutral-200 font-bold uppercase text-[10px] tracking-wider font-mono">
                    AI Smart Chatbot (Gemini-Powered)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setChatbotEnabled(!chatbotEnabled)}
                  className={`px-2 py-1 font-mono text-[9px] uppercase font-bold rounded cursor-pointer ${
                    chatbotEnabled
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                  }`}
                >
                  {chatbotEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <p className="text-[9.5px] text-neutral-400 leading-normal font-sans">
                Runs a highly capable AI assistant that immediately answers queries using Gemini 3.5 Flash and real-time database menus.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-neutral-500 uppercase text-[9px] font-bold block">Chatbot Display Name</span>
                  <input
                    type="text"
                    value={chatbotName}
                    onChange={(e) => setChatbotName(e.target.value)}
                    disabled={!chatbotEnabled}
                    placeholder="e.g. Upside Smart Assistant"
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-[11px] p-2.5 focus:border-amber-500 outline-none rounded disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-500 uppercase text-[9px] font-bold block">Custom Welcome Message</span>
                  <textarea
                    value={chatbotWelcome}
                    onChange={(e) => setChatbotWelcome(e.target.value)}
                    disabled={!chatbotEnabled}
                    rows={2}
                    placeholder="Provide a welcoming text greeting..."
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-[11px] p-2.5 focus:border-amber-500 outline-none rounded disabled:opacity-40 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Action */}
            <div className="md:col-span-2 border-t border-neutral-850 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isConfigSaving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-md"
              >
                {isConfigSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>SAVING CHANNELS CONFIG...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>✓ SAVE SUPPORT CONFIG</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

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
              <div
                ref={messagesContainerRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#181818] scrollbar-thin scrollbar-thumb-neutral-850"
              >
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
                            {safeGetDate(msg.timestamp).toLocaleTimeString([], {
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
