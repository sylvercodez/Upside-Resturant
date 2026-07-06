import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, MessageCircle, Clock, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [botName, setBotName] = useState("Upside Smart Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! Welcome to Upside Restaurant & Café. Ask me anything about our menu, delivery fees, or helpdesk requests!");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [menuItems, setMenuItems] = useState<any[]>([]);

  // 1. Fetch live menus for chatbot matching
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const snap = await getDocs(collection(db, "menus"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          setMenuItems(list.filter((item: any) => !item.deleted));
        } else {
          const { MENU_ITEMS } = await import("../data/menu");
          setMenuItems(MENU_ITEMS);
        }
      } catch (err) {
        console.warn("Failed to fetch menus for chatbot matching:", err);
        try {
          const { MENU_ITEMS } = await import("../data/menu");
          setMenuItems(MENU_ITEMS);
        } catch (_) {}
      }
    };
    fetchMenus();
  }, []);

  const findMatchingItems = (text: string) => {
    if (!text) return [];
    const matched: any[] = [];
    menuItems.forEach((item) => {
      const textLower = text.toLowerCase();
      const itemNameLower = item.name.toLowerCase();
      if (textLower.includes(itemNameLower)) {
        if (!matched.some(m => m.id === item.id)) {
          matched.push(item);
        }
      } else {
        const cleanName = itemNameLower.replace(/[^a-z0-9]/g, " ");
        const words = cleanName.split(/\s+/).filter((w: string) => w.length > 3);
        if (words.length >= 2 && words.every((word: string) => textLower.includes(word))) {
          if (!matched.some(m => m.id === item.id)) {
            matched.push(item);
          }
        }
      }
    });
    return matched;
  };

  const handleAddMenuToCart = (item: any) => {
    if (typeof (window as any).addToCartDirect === "function") {
      (window as any).addToCartDirect(item);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🛒 Added **${item.name}** to your Cart and directed you to your checkout page!`,
          timestamp: new Date()
        }
      ]);
    } else {
      alert("Cart service is temporarily unavailable.");
    }
  };

  const handleConnectSupport = () => {
    const tawk = (window as any).Tawk_API;
    if (tawk && typeof tawk.maximize === "function") {
      tawk.maximize();
      setIsOpen(false);
    } else {
      window.dispatchEvent(new CustomEvent("open-upside-live-support"));
      setIsOpen(false);
    }
  };

  // 1. Fetch Chatbot Settings on Mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "support_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEnabled(data.chatbotEnabled ?? true);
          setBotName(data.chatbotName ?? "Upside Smart Assistant");
          setWelcomeMessage(data.chatbotWelcome ?? "Hello! Welcome to Upside Restaurant & Café. Ask me anything about our menu, delivery fees, or helpdesk requests!");
        }
      } catch (err) {
        console.error("Error loading chatbot config:", err);
      }
    };
    fetchConfig();
  }, []);

  // 2. Add Welcome Message once chatbot is opened or initialized
  useEffect(() => {
    if (messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);
    }
  }, [welcomeMessage, messages.length]);

  // 3. Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!enabled) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = inputText.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    const lowerText = messageText.toLowerCase();

    // 1. Live Support interceptor
    if (
      lowerText.includes("support") || 
      lowerText.includes("live agent") || 
      lowerText.includes("live chat") || 
      lowerText.includes("human") || 
      lowerText.includes("speak to") || 
      lowerText.includes("tawk")
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connecting you directly to our live support concierge team... Just a second!",
          timestamp: new Date()
        }
      ]);
      setTimeout(() => {
        handleConnectSupport();
      }, 1500);
      setIsLoading(false);
      return;
    }

    // 2. Menu Redirect interceptor
    if (
      lowerText.includes("view menu") || 
      lowerText.includes("show menu") || 
      lowerText.includes("route to menu") || 
      lowerText.includes("go to menu")
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Redirecting you to our gourmet menu section...",
          timestamp: new Date()
        }
      ]);
      setTimeout(() => {
        if (typeof (window as any).navigateUpside === "function") {
          (window as any).navigateUpside("/menu");
          setIsOpen(false);
        }
      }, 1200);
      setIsLoading(false);
      return;
    }

    // 3. Reservations / Booking FAQ Redirect interceptor
    if (
      lowerText.includes("booking faq") || 
      lowerText.includes("reservation faq") || 
      lowerText.includes("how to book") || 
      lowerText.includes("how to reserve") || 
      lowerText.includes("table faq")
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Opening our detailed bookings & reservation FAQ portal...",
          timestamp: new Date()
        }
      ]);
      setTimeout(() => {
        if (typeof (window as any).navigateUpside === "function") {
          (window as any).navigateUpside("/faq");
          setIsOpen(false);
        }
      }, 1200);
      setIsLoading(false);
      return;
    }

    try {
      // Format chat history for Gemini API API endpoint
      const history = messages.slice(1).map((msg) => ({
        role: msg.role,
        text: msg.content
      }));

      const response = await fetch(getApiUrl("/api/chatbot"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          history
        })
      });

      if (!response.ok) {
        throw new Error("Chatbot endpoint failed");
      }

      const data = await response.json();
      const botReply = data.reply || "I am having trouble processing that right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: botReply,
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error("Failed to fetch AI reply:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm currently experiencing connectivity issues. Please check your internet connection or ask our live support team.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Do you want to clear your current conversation history?")) {
      setMessages([
        {
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[360px] h-[500px] sm:w-[400px] sm:h-[550px] bg-[#141414] border border-neutral-800 shadow-2xl flex flex-col overflow-hidden mb-4 rounded-xl text-left"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-600/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                    {botName}
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-medium">Instant AI Concierge</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#181818]"
            >
              {messages.map((msg, index) => {
                const isBot = msg.role === "assistant";
                const matchedDishes = isBot ? findMatchingItems(msg.content) : [];
                return (
                  <div
                    key={index}
                    className={`flex flex-col gap-2 max-w-[85%] ${
                      isBot ? "mr-auto text-left" : "ml-auto text-right"
                    }`}
                  >
                    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
                      {isBot && (
                        <div className="w-7 h-7 bg-amber-600/10 border border-amber-500/20 rounded-md flex items-center justify-center shrink-0 self-start">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`p-3 text-xs leading-relaxed rounded-xl ${
                            isBot
                              ? "bg-neutral-800/80 text-neutral-200 rounded-tl-none border border-neutral-800/40"
                              : "bg-amber-600 text-black font-semibold rounded-tr-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[8px] font-mono text-neutral-500 mt-1 self-end px-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Matched Menu Items list */}
                    {isBot && matchedDishes.length > 0 && (
                      <div className="pl-10 pr-2 py-1 space-y-1.5 animate-fadeIn">
                        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Matched Gourmet Dishes:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedDishes.map((dish) => (
                            <button
                              key={dish.id}
                              onClick={() => handleAddMenuToCart(dish)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-mono font-bold text-[9px] uppercase rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              🛒 Add {dish.name} (₦{dish.price.toLocaleString()})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 bg-amber-600/10 border border-amber-500/20 rounded-md flex items-center justify-center shrink-0 self-start">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="p-3 bg-neutral-800/80 rounded-xl rounded-tl-none border border-neutral-800/40 flex items-center gap-1.5 py-4 px-5">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Quick Chips Panel */}
            {!isLoading && (
              <div className="px-3 py-2 bg-[#121212] border-t border-neutral-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof (window as any).navigateUpside === "function") {
                      (window as any).navigateUpside("/menu");
                      setIsOpen(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-[10px] text-neutral-300 rounded-full transition-all shrink-0 cursor-pointer hover:text-white"
                >
                  🍛 Explore Menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof (window as any).navigateUpside === "function") {
                      (window as any).navigateUpside("/faq");
                      setIsOpen(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-[10px] text-neutral-300 rounded-full transition-all shrink-0 cursor-pointer hover:text-white"
                >
                  📅 Table Booking FAQ
                </button>
                <button
                  type="button"
                  onClick={handleConnectSupport}
                  className="px-2.5 py-1.5 bg-[#1a1410] border border-amber-500/20 hover:border-amber-500/50 text-[10px] text-amber-400 rounded-full transition-all shrink-0 cursor-pointer"
                >
                  💬 Speak to Support
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputText("How do I order Smoky Party Jollof Rice?");
                  }}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-[10px] text-neutral-300 rounded-full transition-all shrink-0 cursor-pointer hover:text-white"
                >
                  🛒 How to Order
                </button>
              </div>
            )}

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about items, locations, hours..."
                className="flex-grow bg-[#141414] border border-neutral-800 text-xs p-3 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-neutral-500 font-medium"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-10 h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center transition-all disabled:opacity-40 shrink-0 cursor-pointer rounded-lg shadow-md hover:shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-xl transition-all cursor-pointer rounded-full relative border border-amber-400/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
