import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Clock, ShieldAlert, X } from "lucide-react";
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import { socket } from "../socket";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || "anonymous_tracking_guest",
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || true,
    },
    operationType,
    path,
  };
  console.error("Firestore Chat Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface LiveChatProps {
  orderId: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  onClose?: () => void;
  theme?: "dark" | "light";
}

export default function LiveChat({
  orderId,
  senderId,
  senderName,
  recipientName,
  onClose,
  theme = "dark",
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages subcollection and connect to Socket.IO
  useEffect(() => {
    if (!orderId) return;

    // Join Socket.IO room for this order
    socket.emit("join-room", `order_${orderId}`);

    const path = `orders/${orderId}/messages`;
    const messagesQuery = query(
      collection(db, "orders", orderId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMsgs: ChatMessage[] = [];
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
          // Merge logic to avoid replacing any socket messages and to ensure chronological order
          const merged = [...prev];
          fetchedMsgs.forEach((msg) => {
            if (!merged.some((m) => m.id === msg.id)) {
              merged.push(msg);
            }
          });
          return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
        setError(null);
      },
      (err) => {
        setError("Unable to sync messages. Access is restricted.");
        try {
          handleFirestoreError(err, OperationType.GET, path);
        } catch (_) {
          // Handled via state
        }
      }
    );

    // Listen to real-time Socket.IO messages
    const handleIncomingOrderMsg = (data: any) => {
      if (data.orderId === orderId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          const updated = [...prev, {
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp
          }];
          return updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    };

    socket.on("order-message", handleIncomingOrderMsg);

    return () => {
      unsubscribe();
      socket.off("order-message", handleIncomingOrderMsg);
    };
  }, [orderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);
    setError(null);

    const messageId = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    const path = `orders/${orderId}/messages/${messageId}`;

    const payload = {
      id: messageId,
      orderId,
      senderId,
      senderName,
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
      }].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    setInputText("");

    // Dispatch via Socket.IO instantly
    socket.emit("order-message", payload);

    try {
      const messageDocRef = doc(db, "orders", orderId, "messages", messageId);
      await setDoc(messageDocRef, {
        senderId: payload.senderId,
        senderName: payload.senderName,
        text: payload.text,
        timestamp: payload.timestamp
      });
    } catch (err: any) {
      setError("Failed to dispatch message. Access denied.");
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (_) {
        // Handled via state
      }
    } finally {
      setIsSending(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`flex flex-col h-[400px] border ${
        isDark
          ? "bg-[#121212] border-neutral-800 text-neutral-100"
          : "bg-white border-neutral-200 text-neutral-800"
      } shadow-xl animate-fadeIn`}
      id={`live-chat-panel-${orderId}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3.5 border-b ${
          isDark ? "bg-neutral-900 border-neutral-850" : "bg-neutral-50 border-neutral-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full bg-amber-500 animate-pulse`} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-mono tracking-wider uppercase">
              Live Rider Chat
            </h4>
            <p className="text-[9px] text-neutral-500 font-mono uppercase">
              Active: {recipientName || "Assigned Courier"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-neutral-200 text-neutral-500 hover:text-neutral-950"
            }`}
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-60">
            <MessageSquare className={`w-8 h-8 ${isDark ? "text-neutral-700" : "text-neutral-300"}`} />
            <p className="text-[10px] font-mono tracking-wider uppercase">
              No messages exchanged yet
            </p>
            <p className="text-[9px] max-w-[200px] leading-relaxed">
              Initiate communication to coordinate delivery logistics, secure drop-off parameters, or gate-codes.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === senderId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <span className="text-[8px] font-mono tracking-wider text-neutral-500 uppercase mb-0.5">
                  {msg.senderName}
                </span>
                <div
                  className={`p-3 text-xs leading-relaxed ${
                    isSelf
                      ? isDark
                        ? "bg-amber-600 text-black font-medium"
                        : "bg-amber-500 text-neutral-900 font-medium"
                      : isDark
                      ? "bg-neutral-800 text-neutral-100"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                  style={{ borderRadius: isSelf ? "12px 12px 2px 12px" : "12px 12px 12px 2px" }}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-50">
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

      {/* Error / Alert Bar */}
      {error && (
        <div className="px-3 py-1.5 bg-red-950/20 border-t border-red-900/30 text-red-500 text-[9px] font-mono flex items-center gap-1.5 animate-shake">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className={`p-2.5 border-t flex gap-2 ${
          isDark ? "bg-neutral-950 border-neutral-850" : "bg-neutral-50 border-neutral-200"
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a secure message to rider..."
          className={`flex-grow text-xs font-sans p-2 px-3 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
            isDark
              ? "bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500"
              : "bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
          }`}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className={`p-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-neutral-950 flex items-center justify-center disabled:opacity-40 disabled:scale-100 cursor-pointer`}
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
