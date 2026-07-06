import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Headphones, Clock, Check, AlertCircle, Loader } from "lucide-react";
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { socket } from "../socket";

interface SupportChatWidgetProps {
  currentUser?: any;
}

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export default function SupportChatWidget({ currentUser }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [tawkEnabled, setTawkEnabled] = useState(false);

  // Subscribe to live tawk support state to prevent widget collision
  useEffect(() => {
    const docRef = doc(db, "settings", "support_config");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTawkEnabled(docSnap.data().tawkEnabled ?? false);
      }
    }, (err) => {
      console.warn("Failed to subscribe to support_config inside support widget:", err);
    });
    return () => unsubscribe();
  }, []);
  
  // Form fields for starting a new session
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [initialMsg, setInitialMsg] = useState("");
  
  // Chatting state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // 1. Initialize or load active session from localStorage on mount
  useEffect(() => {
    const savedChatId = localStorage.getItem("upside_support_chat_id");
    const savedName = localStorage.getItem("upside_support_name");
    const savedEmail = localStorage.getItem("upside_support_email");

    if (savedChatId && savedName) {
      setChatId(savedChatId);
      setCustomerName(savedName);
      setEmail(savedEmail || "");
      setHasSession(true);
    } else if (currentUser) {
      // Pre-fill fields if user is logged in
      setCustomerName(currentUser.displayName || currentUser.fullName || currentUser.email?.split("@")[0] || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // 2. Subscribe to real-time messages and Socket.IO once session is active
  useEffect(() => {
    if (!chatId) return;

    // Join the support socket room
    socket.emit("join-room", `support_${chatId}`);

    const messagesQuery = query(
      collection(db, "support_chats", chatId, "messages"),
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
        console.error("Error subscribing to customer support messages: ", err);
        setError("Synchronization issue. Access is temporarily restricted.");
      }
    );

    // Listen to real-time Socket.IO support messages
    const handleIncomingSupportMsg = (data: any) => {
      if (data.sessionId === chatId) {
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
  }, [chatId]);

  // Scroll to bottom on new messages (internal container scroll only - prevents screen-scrolling jumps!)
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // 3. Handle initiating a support ticket session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    const cleanEmail = email.trim();
    const cleanMsg = initialMsg.trim();

    if (!cleanName || !cleanMsg) {
      setError("Please fill out your Name and your initial question.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    const newChatId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const messageId = "msg_init_" + Date.now();

    const parentPayload = {
      chatId: newChatId,
      customerName: cleanName,
      email: cleanEmail,
      status: "active",
      updatedAt: new Date().toISOString(),
      lastMessageText: cleanMsg,
    };

    const firstMessagePayload = {
      id: messageId,
      sessionId: newChatId,
      senderId: "customer",
      senderName: cleanName,
      text: cleanMsg,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Create support ticket session document
      const chatDocRef = doc(db, "support_chats", newChatId);
      await setDoc(chatDocRef, parentPayload);

      // 2. Create first message document in subcollection
      const msgDocRef = doc(db, "support_chats", newChatId, "messages", messageId);
      await setDoc(msgDocRef, {
        senderId: firstMessagePayload.senderId,
        senderName: firstMessagePayload.senderName,
        text: firstMessagePayload.text,
        timestamp: firstMessagePayload.timestamp
      });

      // 3. Store session state in localStorage
      localStorage.setItem("upside_support_chat_id", newChatId);
      localStorage.setItem("upside_support_name", cleanName);
      if (cleanEmail) {
        localStorage.setItem("upside_support_email", cleanEmail);
      }

      // 4. Update UI states
      setChatId(newChatId);
      setHasSession(true);
      setInitialMsg("");
      
      // Join room and dispatch via Socket.IO instantly
      socket.emit("join-room", `support_${newChatId}`);
      socket.emit("support-message", firstMessagePayload);

    } catch (err: any) {
      console.error("Error initiating support chat:", err);
      setError("Unable to establish secure chat connection.");
    } finally {
      setIsConnecting(false);
    }
  };

  // 4. Send a subsequent message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending || !chatId) return;

    setIsSending(true);
    setError(null);

    const messageId = "msg_" + Date.now();
    const payload = {
      id: messageId,
      sessionId: chatId,
      senderId: "customer",
      senderName: customerName,
      text: cleanText,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update local UI instantly
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

    // Emit Socket.IO message instantly
    socket.emit("support-message", payload);

    try {
      const msgDocRef = doc(db, "support_chats", chatId, "messages", messageId);
      await setDoc(msgDocRef, {
        senderId: payload.senderId,
        senderName: payload.senderName,
        text: payload.text,
        timestamp: payload.timestamp
      });

      const parentDocRef = doc(db, "support_chats", chatId);
      await setDoc(parentDocRef, {
        lastMessageText: cleanText,
        updatedAt: new Date().toISOString()
      }, { merge: true });

    } catch (err: any) {
      console.error("Error dispatching helpdesk message:", err);
      setError("Failed to broadcast message.");
    } finally {
      setIsSending(false);
    }
  };

  // Reset the active support chat session
  const handleClearSession = () => {
    if (window.confirm("Are you sure you want to end this active helpdesk ticket?")) {
      localStorage.removeItem("upside_support_chat_id");
      localStorage.removeItem("upside_support_name");
      localStorage.removeItem("upside_support_email");
      setChatId(null);
      setHasSession(false);
      setMessages([]);
      setInputText("");
      setError(null);
    }
  };

  if (tawkEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="upside-live-support-widget">
      {/* Collapsible Chat Card Window */}
      {isOpen && (
        <div className="w-[340px] h-[460px] bg-[#121212] border border-neutral-800 shadow-2xl flex flex-col mb-4 animate-fadeIn overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-neutral-900 border-b border-neutral-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded">
                <Headphones className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-100">
                  Upside Helpdesk
                </h3>
                <span className="text-[8.5px] font-mono tracking-wider text-neutral-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Realtime via WebSockets
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {hasSession && (
                <button
                  onClick={handleClearSession}
                  className="text-[8px] font-mono border border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-950 px-1.5 py-0.5 uppercase transition-all rounded"
                  title="Close support session"
                >
                  End Ticket
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Collapse Support Radar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#141414]">
            {error && (
              <div className="p-2.5 bg-red-950/20 border-b border-red-900/30 text-red-500 text-[9px] font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!hasSession ? (
              /* ONBOARDING FORM VIEW */
              <form onSubmit={handleStartSession} className="flex-1 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono tracking-wider uppercase text-neutral-400">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Amanda Cole"
                      className="w-full bg-neutral-950 border border-neutral-850 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono tracking-wider uppercase text-neutral-400">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. amanda@example.com"
                      className="w-full bg-neutral-950 border border-neutral-850 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono tracking-wider uppercase text-neutral-400">Describe Your Question</label>
                    <textarea
                      required
                      rows={3}
                      value={initialMsg}
                      onChange={(e) => setInitialMsg(e.target.value)}
                      placeholder="How can our support team assist you today?"
                      className="w-full bg-neutral-950 border border-neutral-850 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-55 transition-all text-neutral-950 font-mono text-xs font-bold uppercase tracking-wider p-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Radar...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Launch Support Ticket</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REAL-TIME MSG TRANSCRIPT VIEW */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div
                  ref={messagesContainerRef}
                  className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-neutral-800"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-neutral-600">
                      <Loader className="w-6 h-6 animate-spin text-amber-500" />
                      <p className="text-[9px] font-mono uppercase tracking-wider">Syncing secure connection...</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSelf = msg.senderId === "customer";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <span className="text-[8px] font-mono tracking-wider text-neutral-500 uppercase mb-0.5 flex items-center gap-1">
                            {msg.senderName}
                            {!isSelf && (
                              <span className="text-[7px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-1 rounded font-bold font-mono">
                                STAFF
                              </span>
                            )}
                          </span>
                          <div
                            className={`p-2.5 text-xs leading-relaxed ${
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

                {/* Secure message reply form */}
                <form onSubmit={handleSendMessage} className="p-2 border-t border-neutral-850 bg-neutral-900 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type message to Helpdesk..."
                    className="flex-grow bg-neutral-950 border border-neutral-800 text-xs p-2 focus:outline-none focus:border-amber-500 text-white font-sans"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer font-bold font-mono"
                    title="Send to support"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Launcher Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-2xl flex items-center justify-center active:scale-90 transition-all cursor-pointer relative"
        title="Live Support Chat"
        id="support-chat-launcher-btn"
      >
        {isOpen ? (
          <X className="w-5 h-5 font-bold" />
        ) : (
          <MessageSquare className="w-5 h-5 font-bold animate-pulse" />
        )}
      </button>
    </div>
  );
}
