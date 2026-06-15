import React from "react";
import { Coffee, Shield, Phone, Mail, MapPin, Facebook, Instagram, Music } from "lucide-react";

interface FooterProps {
  onScrollToElement: (elementId: string) => void;
  onOpenReservations: () => void;
  branding?: {
    logoSvg: string;
    brandName: string;
    tagline: string;
    subText: string;
  } | null;
}

export default function Footer({ onScrollToElement, onOpenReservations, branding }: FooterProps) {
  return (
    <footer className="bg-white text-neutral-600 font-mono text-xs border-t border-neutral-200 pt-16 pb-24 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
        
        {/* Brand details Column */}
        <div className="space-y-4">
          <div className="flex items-center select-none animate-fadeIn">
            {branding?.logoSvg ? (
              <div 
                className="w-28 h-28 md:w-32 md:h-32 overflow-hidden flex items-center justify-center p-0 flex-shrink-0"
                dangerouslySetInnerHTML={{ __html: branding.logoSvg }}
              />
            ) : (
              <div className="flex flex-col items-start leading-tight">
                <span className="text-lg font-bold text-neutral-900 tracking-widest font-sans uppercase">
                  UPSIDE
                </span>
                <span className="text-[9px] font-mono tracking-[0.3em] text-neutral-400 uppercase">
                  RESTAURANT &amp; CAFÉ
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
            Pioneering digital hospitality and Afrobeat luxury dining inside Lekki, Lagos. Combining custom high-roast espresso bar and premium prime grills.
          </p>
          <div className="space-y-2 pt-2 text-[11px]">
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-neutral-900 font-bold">0911 - 464 - 6767</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-neutral-600 hover:text-amber-600 hover:underline transition-all cursor-pointer">concierge@upsidelagos.com</span>
            </p>
          </div>
          
          {/* Social Icons Row */}
          <div className="flex items-center gap-3 pt-3" id="footer-social-links">
            <a
              href="https://facebook.com/upsiderestaurantlagos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all cursor-pointer shadow-sm hover:scale-105 duration-200"
              title="Follow Upside on Facebook"
              id="footer-social-facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/upside_lagos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all cursor-pointer shadow-sm hover:scale-105 duration-200"
              title="Follow Upside on Instagram"
              id="footer-social-instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://tiktok.com/@upside_lagos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all cursor-pointer shadow-sm hover:scale-105 duration-200"
              title="Follow Upside on TikTok"
              id="footer-social-tiktok"
            >
              <Music className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Operating Hours Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-200 pb-2">
            Opening Hours
          </h4>
          <div className="space-y-2.5 text-[11px] text-neutral-600">
            <div>
              <p className="text-neutral-900 font-bold flex justify-between">
                <span>AM: Boutique Café</span>
                <span className="text-amber-600">OPEN</span>
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Monday &mdash; Sunday: 07:00 AM &ndash; 05:00 PM</p>
            </div>
            <div>
              <p className="text-neutral-900 font-bold flex justify-between">
                <span>PM: Fine Lounge & Grill</span>
                <span className="text-amber-600">OPEN</span>
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Monday &mdash; Sunday: 05:00 PM &ndash; 02:00 AM</p>
            </div>
            <div>
              <p className="text-amber-700 font-bold">Curated Ambient Soundscape</p>
              <p className="text-[10px] text-neutral-400">Continuous high-fidelity auditory craft</p>
            </div>
          </div>
        </div>

        {/* Rapid Navigate Links Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-200 pb-2">
            The Sanctuary
          </h4>
          <ul className="space-y-2.5 text-[11px] text-neutral-600">
            <li>
              <button onClick={() => onScrollToElement("hero")} className="hover:text-amber-650 hover:underline transition-colors text-left">
                Lobby Landing
              </button>
            </li>
            <li>
              <button onClick={() => onScrollToElement("menu-fast")} className="hover:text-amber-650 hover:underline transition-colors text-left">
                Fast Menu Access
              </button>
            </li>
            <li>
              <button onClick={onOpenReservations} className="hover:text-amber-650 hover:underline transition-colors text-left">
                Table Seating Allocations
              </button>
            </li>
            <li>
              <button onClick={() => onScrollToElement("experience")} className="hover:text-amber-650 hover:underline transition-colors text-left">
                Sensory Soundscape
              </button>
            </li>
          </ul>
        </div>

        {/* Address and Map Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-200 pb-2">
            Our Location
          </h4>
          <div className="space-y-2.5 text-[11px]">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-600">32A, Admiralty Way, Lekki Phase 1, Lagos, Nigeria.</span>
            </p>
            {/* Hardcoded Premium Visual Mini map styling */}
            <div className="h-24 bg-neutral-50 border border-neutral-200 p-2 text-[9px] text-neutral-600 relative flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />
              <div className="relative text-center uppercase tracking-wider z-10 space-y-1">
                <span className="text-neutral-900 block font-bold font-sans">Upside Lekki Map</span>
                <span>Near Elite Golf Links &bull; Secured Valet</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Corporate details line */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-neutral-400 text-center sm:text-left">
        <div>
          <p className="text-neutral-500 font-medium">&copy; 2026 Upside Restaurant &amp; Café. A Brand of Mopheth. All Rights Reserved.</p>
          
        </div>
        <div className="flex gap-6 uppercase tracking-widest text-[9px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Paystack Secured Client</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <span>Single Origin Direct-Trade</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
