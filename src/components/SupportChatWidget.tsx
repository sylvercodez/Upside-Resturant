import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Clock, Headphones, CheckCircle2, ShieldAlert } from "lucide-react";
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface SupportChatWidgetProps {
  currentUser?: any;
}

export default function SupportChatWidget({ currentUser }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSubscribed = useRef(false);

  // Sync user details when logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || currentUser.fullName || currentUser.email?.split("@")[0] || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // Load existing support chat session from localStorage
  useEffect(() => {
    const savedChatId = localStorage.getItem("upside_support_chat_id");
    const savedHasStarted = localStorage.getItem("upside_support_chat_started");
    
    if (savedChatId) {
      setChatId(savedChatId);
      if (savedHasStarted === "true") {
        setHasStarted(true);
      }
    } else {
      const newChatId = "support_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("upside_support_chat_id", newChatId);
      setChatId(newChatId);
    }
  }, []);

  // Monitor real-time messages when chat has started
  useEffect(() => {
    if (!chatId || !hasStarted) return;

    const messagesQuery = query(
      collection(db, "support_chats", chatId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    hasSubscribed.current = true;

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

        // Update unread count if the chat window is closed
        if (!isOpen && fetchedMsgs.length > 0) {
          const lastMsg = fetchedMsgs[fetchedMsgs.length - 1];
          if (lastMsg.senderId !== "customer") {
            setUnreadCount((prev) => prev + 1);
          }
        }
      },
      (err) => {
        console.error("Support Chat Subscription error: ", err);
        setError("Database link offline. Please try again.");
      }
    );

    return () => unsubscribe();
  }, [chatId, hasStarted, isOpen]);

  // Reset unread count when chat window is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      // 1. Write the main support chat document
      const chatDocRef = doc(db, "support_chats", chatId!);
      const payload = {
        chatId: chatId!,
        customerName: name.trim(),
        email: email.trim(),
        status: "active",
        updatedAt: new Date().toISOString(),
      };
      await setDoc(chatDocRef, payload);

      // 2. Create welcoming message from support desk
      const welcomeMsgId = "msg_welcome";
      const welcomeDocRef = doc(db, "support_chats", chatId!, "messages", welcomeMsgId);
      const welcomePayload = {
        senderId: "system_support",
        senderName: "Joy (Support Desk)",
        text: `Hi ${name.trim()}! Thank you for contacting Upside Restaurant & Café support. Our team is online and ready to assist you. What can we help you with today?`,
        timestamp: new Date().toISOString(),
      };
      await setDoc(welcomeDocRef, welcomePayload);

      // 3. Mark session as started
      localStorage.setItem("upside_support_chat_started", "true");
      setHasStarted(true);
    } catch (err) {
      console.error("Error launching support chat:", err);
      setError("Unable to initialize chat session. Connection blocked.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending || !chatId) return;

    setIsSending(true);
    setError(null);

    const messageId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const messageDocRef = doc(db, "support_chats", chatId, "messages", messageId);

    const payload = {
      senderId: "customer",
      senderName: name || "Customer Guest",
      text: cleanText,
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(messageDocRef, payload);
      
      // Update the parent chat metadata updatedAt timestamp to bubble it up
      const chatDocRef = doc(db, "support_chats", chatId);
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

      // Provide automated intelligent simulation responses for enhanced interactivity
      triggerSimulatedSupportReply(cleanText);
    } catch (err) {
      console.error("Error dispatching support message:", err);
      setError("Message transmission failed.");
    } finally {
      setIsSending(false);
    }
  };

  const triggerSimulatedSupportReply = (userMessage: string) => {
    const textLower = userMessage.toLowerCase();
    let replyText = "Understood. I am connecting you with our human support representative right away. Please hold on for a moment!";

    if (textLower.includes("menu") || textLower.includes("food") || textLower.includes("price") || textLower.includes("steak") || textLower.includes("order")) {
      replyText = "We offer a gourmet collection of sizzling steaks, side platters, signature burgers, and fresh juices! You can view our entire dynamic menu directly by navigating to the 'Menu' page in the top bar, and add items straight to your cart.";
    } else if (textLower.includes("opay") || textLower.includes("payment") || textLower.includes("pay") || textLower.includes("verify")) {
      replyText = "For safe instant checkout inside Lagos, we support OPay payment. After processing on OPay, please wait to be automatically redirected back so our systems verify your transaction securely and update your order tracking instantly!";
    } else if (textLower.includes("reservation") || textLower.includes("table") || textLower.includes("book")) {
      replyText = "Table reservations at Upside Restaurant & Café are completely digital! You can quickly book your private dining experience or group events using our 'Book a Table' form at the bottom of the home screen.";
    } else if (textLower.includes("delivery") || textLower.includes("time") || textLower.includes("rider") || textLower.includes("shipping")) {
      replyText = "We coordinate direct-to-door deliveries using our premium high-fidelity street mapping. Once a rider is assigned to your order, you can track them on the live map and chat with them in real-time under your 'Order Status' panel!";
    } else if (textLower.includes("location") || textLower.includes("address") || textLower.includes("lagos") || textLower.includes("where")) {
      replyText = "Our boutique kitchen and restaurant is situated in Lagos, Nigeria. We offer home delivery services across all major zones in Lagos with dynamic delivery fee calculations based on your selected shipping area.";
    } else if (textLower.includes("hello") || textLower.includes("hi") || textLower.includes("hey")) {
      replyText = "Hello! Welcome to our live service desk. How can I help you today? Ask me about food orders, OPay checkout, delivery status, or custom catering!";
    }

    // Insert simulated response after 2.5 seconds
    setTimeout(async () => {
      if (!chatId) return;
      const autoMsgId = "msg_auto_" + Date.now();
      const autoDocRef = doc(db, "support_chats", chatId, "messages", autoMsgId);
      try {
        await setDoc(autoDocRef, {
          senderId: "system_support",
          senderName: "Joy (Support Desk)",
          text: replyText,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Error inserting simulated response:", err);
      }
    }, 2500);
  };

  return (
    <div className="fixed bottom-24 right-5 z-[8000]" id="global-support-chat">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group cursor-pointer border-2 border-neutral-900"
          title="Contact Support Desk"
        >
          <Headphones className="w-6 h-6 animate-pulse" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border border-black animate-bounce">
              {unreadCount}
            </span>
          )}
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-neutral-900 text-amber-500 text-[10px] font-mono font-bold tracking-widest uppercase p-2 border border-amber-500/20 whitespace-nowrap transition-all duration-200 shadow-xl">
            Live Support Desk
          </span>
        </button>
      )}

      {/* Support Chat Dialog Panel */}
      {isOpen && (
        <div className="w-[340px] md:w-[380px] h-[480px] bg-[#121212] border border-neutral-800 text-neutral-100 flex flex-col shadow-2xl animate-fadeIn relative rounded-none">
          {/* Header */}
          <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                  Upside Help Desk
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8.5px] font-mono text-neutral-400 uppercase tracking-widest">
                    Support Staff Online
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Minimize chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form screen (for guest users to input name/email) */}
          {!hasStarted ? (
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="text-center space-y-1.5 pb-2 border-b border-neutral-850">
                  <p className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">
                    Start Secure Live Chat
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                    Welcome! Provide your name and email to initiate a real-time secure communication session with our assistance agents.
                  </p>
                </div>

                <form onSubmit={handleStartChat} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-sans p-3 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase font-bold block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-sans p-3 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-500 text-[10px] font-mono flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? "Launching Desk..." : "Begin Session"}
                  </button>
                </form>
              </div>

              <div className="pt-4 text-center border-t border-neutral-850 opacity-50">
                <p className="text-[8px] font-mono uppercase tracking-widest">
                  Secure Helpdesk | Powered by Firestore Real-time
                </p>
              </div>
            </div>
          ) : (
            /* Active real-time chat screen */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Messages Grid */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-neutral-850 bg-[#161616]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-60">
                    <MessageSquare className="w-8 h-8 text-neutral-700" />
                    <p className="text-[10px] font-mono tracking-wider uppercase">
                      Initializing Session...
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === "customer";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isSelf ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <span className="text-[8px] font-mono tracking-wider text-neutral-500 uppercase mb-0.5">
                          {msg.senderName}
                        </span>
                        <div
                          className={`p-3 text-xs leading-relaxed ${
                            isSelf
                              ? "bg-amber-500 text-black font-medium rounded-[12px_12px_2px_12px]"
                              : "bg-neutral-850 text-neutral-100 rounded-[12px_12px_12px_2px]"
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

              {/* Input section */}
              <div className="border-t border-neutral-800 bg-neutral-900 p-2.5">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type support question..."
                    className="flex-grow text-xs font-sans p-2.5 px-3.5 bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:scale-100 cursor-pointer"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
