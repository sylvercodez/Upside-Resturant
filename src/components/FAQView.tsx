import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft, Calendar, HelpCircle as HelpIcon, MessageSquare } from "lucide-react";

interface FAQViewProps {
  onBackToLobby: () => void;
  onOpenReservations: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

export default function FAQView({ onBackToLobby, onOpenReservations }: FAQViewProps) {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const categories: FAQCategory[] = [
    {
      title: "Reservations & Bookings",
      icon: "📅",
      items: [
        {
          question: "How do I book a table at Upside?",
          answer: "Booking a table is seamless! You can click the 'Book a Table' button on our website to launch our real-time interactive reservation portal. Choose your date, time, number of guests, and choose from our premium seating options (Standard, Executive Lounge, Terrace Garden, or Bar Counter)."
        },
        {
          question: "Are there any charges for table reservations?",
          answer: "Table reservations at Upside Restaurant & Café are completely complimentary. However, for specialized exclusive seating or group events above 10 guests, we recommend contacting our support concierge team in advance."
        },
        {
          question: "Can I modify or cancel my reservation?",
          answer: "Yes, you can modify or cancel your booking at least 2 hours before your schedule. Simply use our Live Chat Support widget or call our direct helpline for instant assistance."
        },
        {
          question: "What seating areas are available?",
          answer: "We offer four uniquely designed dining atmospheres:\n• Standard Dining: Comfortable, warm family environment\n• Executive Lounge: Private, ultra-premium business setting\n• Terrace Garden: Al fresco, starry-sky beautiful outdoor garden\n• Bar Counter: Energetic, direct lounge bar access with master mixologists"
        }
      ]
    },
    {
      title: "Menu & Delivery Services",
      icon: "🍲",
      items: [
        {
          question: "Which areas in Lagos do you deliver to?",
          answer: "We deliver across major premium locations in Lagos, including Victoria Island, Ikoyi, Lekki Phase 1 & 2, Banana Island, Ikeja GRA, Maryland, and Gbagada."
        },
        {
          question: "What are your delivery fees?",
          answer: "Delivery fees are calculated dynamically based on your location:\n• Ikoyi: Complimentary (₦0 Delivery Fee)\n• Victoria Island: ₦3,000\n• Lekki Phase 1 & 2: ₦4,000 - ₦4,500\n• Banana Island: ₦5,000\n• Mainland (Ikeja, Maryland, Gbagada): ₦5,500 - ₦6,000"
        },
        {
          question: "How can I track my food order?",
          answer: "Once you place an order, you can access our live 'Order Tracker' via the tracking link sent to your device or by navigating to the Track tab using your order ID. You can see real-time preparation status and rider dispatch updates."
        }
      ]
    },
    {
      title: "Payment & Technical Help",
      icon: "💳",
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept multiple secure checkout methods:\n• Online Payment via Paystack (Debit/Credit Cards & Bank Transfers)\n• OPay Direct Secure Checkout\n• WhatsApp Automated Billing Link\n• Cash on Delivery (Available for select verified customers)"
        },
        {
          question: "Do you offer vegetarian or allergen-friendly options?",
          answer: "Yes, our menu lists detailed specifications like 'Gluten-Free', 'Vegetarian', or 'Spicy' on each card. You can also add custom culinary notes to the chef during checkout."
        },
        {
          question: "How can I talk to a real support agent?",
          answer: "Simply open our chat widget in the bottom-right corner. If Tawk.to human chat is enabled by our administration, it will immediately connect you to a live concierge host. Otherwise, our smart AI Assistant or standard helpdesk can process your request."
        }
      ]
    }
  ];

  const toggleAccordion = (catIdx: number, itemIdx: number) => {
    const target = `${catIdx}-${itemIdx}`;
    setOpenIndex(openIndex === target ? null : target);
  };

  const handleOpenLiveSupport = () => {
    // Fire event to open live support widget
    window.dispatchEvent(new CustomEvent("open-upside-live-support"));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans py-12 px-4 sm:px-6 lg:px-8 mt-16 animate-fadeIn" id="upside-faq-page">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-amber-500 uppercase tracking-widest font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            Back to Lobby
          </button>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            Upside Assistance Portal
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <span className="text-amber-500 text-xs">✨</span>
            <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Help & FAQ Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-black uppercase text-white tracking-tight leading-tight">
            How can we <span className="text-amber-500">assist you</span> today?
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Find immediate answers regarding gourmet table reservations, delivery parameters, and our smart hospitality systems.
          </p>
        </div>

        {/* FAQ Grid Categories */}
        <div className="space-y-8 mt-10">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-4 text-left">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-900">
                <span className="text-lg">{cat.icon}</span>
                <h2 className="text-sm font-mono font-black uppercase text-amber-500 tracking-widest">
                  {cat.title}
                </h2>
              </div>

              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => {
                  const itemKey = `${catIdx}-${itemIdx}`;
                  const isOpen = openIndex === itemKey;

                  return (
                    <div
                      key={itemIdx}
                      className="bg-[#121212] border border-neutral-900 rounded-lg overflow-hidden transition-all duration-200 hover:border-neutral-800"
                    >
                      <button
                        onClick={() => toggleAccordion(catIdx, itemIdx)}
                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer focus:outline-none transition-colors duration-200 hover:bg-[#151515]"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-neutral-100 pr-4">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-0 border-t border-neutral-900 bg-neutral-950/40">
                          <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line font-sans">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Luxury CTA Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
          <div className="bg-[#121212] border border-neutral-900 p-6 rounded-lg text-left flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">Ready to dine with us?</h3>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Secure your exclusive lounge, garden, or bar dining experience within seconds.
              </p>
            </div>
            <button
              onClick={onOpenReservations}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono font-black uppercase text-[10px] tracking-wider rounded transition-all cursor-pointer"
            >
              ✓ BOOK A TABLE NOW
            </button>
          </div>

          <div className="bg-[#121212] border border-neutral-900 p-6 rounded-lg text-left flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">Need Custom Help?</h3>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Connect with our Smart AI assistant or standard helpdesk directly for fast resolutions.
              </p>
            </div>
            <button
              onClick={handleOpenLiveSupport}
              className="w-full py-2.5 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-300 hover:text-white font-mono font-black uppercase text-[10px] tracking-wider rounded transition-all cursor-pointer"
            >
              💬 CONNECT WITH SUPPORT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
