import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, MessageCircle, Clock, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

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

    try {
      // Format chat history for Gemini API API endpoint
      const history = messages.slice(1).map((msg) => ({
        role: msg.role,
        text: msg.content
      }));

      const response = await fetch("/api/chatbot", {
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
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${
                      isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
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
