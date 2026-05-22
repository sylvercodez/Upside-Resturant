import React from "react";
import { Coffee, Shield, Phone, Mail, MapPin, Sparkles, MessageSquare } from "lucide-react";

interface FooterProps {
  onScrollToElement: (elementId: string) => void;
  onOpenReservations: () => void;
}

export default function Footer({ onScrollToElement, onOpenReservations }: FooterProps) {
  return (
    <footer className="bg-neutral-950 text-neutral-400 font-mono text-xs border-t border-amber-900/20 pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
        
        {/* Brand details Column */}
        <div className="space-y-4">
          <div className="flex flex-col items-start select-none">
            <span className="text-xl font-bold text-white tracking-widest font-sans uppercase">
              UPSIDE
            </span>
            <span className="text-[9px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
              RESTAURANT & CAFÉ
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
            Pioneering digital hospitality and Afrobeat luxury dining inside Lekki, Lagos. Combining custom high-roast espresso bar and premium prime grills.
          </p>
          <div className="space-y-2 pt-2 text-[11px]">
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-white font-semibold">0911 - 464 - 6767</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>concierge@upsidelagos.com</span>
            </p>
          </div>
        </div>

        {/* Operating Hours Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
            Opening Hours
          </h4>
          <div className="space-y-2.5 text-[11px] text-neutral-400">
            <div>
              <p className="text-white font-semibold flex justify-between">
                <span>AM: Boutique Café</span>
                <span className="text-amber-500">OPEN</span>
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Monday &mdash; Sunday: 07:00 AM &ndash; 05:00 PM</p>
            </div>
            <div>
              <p className="text-white font-semibold flex justify-between">
                <span>PM: Fine Lounge & Grill</span>
                <span className="text-amber-500">OPEN</span>
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Monday &mdash; Sunday: 05:00 PM &ndash; 02:00 AM</p>
            </div>
            <div>
              <p className="text-amber-400 font-semibold">Curated Ambient Soundscape</p>
              <p className="text-[10px] text-neutral-500">Continuous high-fidelity auditory craft</p>
            </div>
          </div>
        </div>

        {/* Rapid Navigate Links Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
            The Sanctuary
          </h4>
          <ul className="space-y-2.5 text-[11px]">
            <li>
              <button onClick={() => onScrollToElement("hero")} className="hover:text-amber-500 transition-colors">
                Lobby Landing
              </button>
            </li>
            <li>
              <button onClick={() => onScrollToElement("menu-fast")} className="hover:text-amber-500 transition-colors">
                Fast Menu Access
              </button>
            </li>
            <li>
              <button onClick={onOpenReservations} className="hover:text-amber-500 transition-colors">
                Table Seating Allocations
              </button>
            </li>
            <li>
              <button onClick={() => onScrollToElement("experience")} className="hover:text-amber-500 transition-colors">
                Sensory Soundscape
              </button>
            </li>
            <li>
              <button onClick={() => onScrollToElement("loyalty")} className="hover:text-amber-500 transition-colors">
                Centurion VIP Club
              </button>
            </li>
          </ul>
        </div>

        {/* Address and Map Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-neutral-900 pb-2">
            Our Location
          </h4>
          <div className="space-y-2.5 text-[11px]">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>32A, Admiralty Way, Lekki Phase 1, Lagos, Nigeria.</span>
            </p>
            {/* Hardcoded Premium Visual Mini map styling */}
            <div className="h-24 bg-neutral-900 border border-neutral-800 p-2 text-[9px] text-neutral-400 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
              <div className="relative text-center uppercase tracking-wider z-10 space-y-1">
                <span className="text-white block font-semibold font-sans">Upside Lekki Map</span>
                <span>Near Elite Golf Links &bull; Secured Valet</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Corporate details line */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-neutral-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-neutral-500 text-center sm:text-left">
        <div>
          <p>&copy; 2026 Upside Restaurant &amp; Café. A Brand of Mopheth. All Rights Reserved.</p>
          <p className="font-light mt-1">Inspired by Lagos Contemporary Gastronomy &amp; Late-Night Rhythms.</p>
        </div>
        <div className="flex gap-6 uppercase tracking-widest text-[9px]">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Paystack Secured Client</span>
          </span>
          <span className="flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <span>Single Origin Direct-Trade</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
