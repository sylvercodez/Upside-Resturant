import React from "react";
import { Coffee, Shield, Phone, Mail, MapPin, Facebook, Instagram, Music, Maximize2, Minimize2, Copy, Check, Compass, ExternalLink, Sliders } from "lucide-react";

interface FooterProps {
  onScrollToElement: (elementId: string) => void;
  onOpenReservations: () => void;
  branding?: {
    logoSvg: string;
    brandName: string;
    tagline: string;
    subText: string;
  } | null;
  onNavigate?: (path: string) => void;
}

export default function Footer({ onScrollToElement, onOpenReservations, branding, onNavigate }: FooterProps) {
  const [isMapWidened, setIsMapWidened] = React.useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const addressText = "CFRW+6W5 Lekki, Ikate Elegushi, Ikate Elegushi, Lagos 106104, Lagos";
  const mapEmbedUrl = "https://maps.google.com/maps?q=CFRW%2B6W5%20Lekki%2C%20Ikate%20Elegushi%2C%20Lagos%20106104%2C%20Lagos&t=&z=16&ie=UTF8&iwloc=&output=embed";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(addressText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <footer className="bg-white text-neutral-600 font-mono text-xs border-t border-neutral-200 pt-16 pb-24 shadow-inner">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
        
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
              <span className="text-neutral-600 hover:text-amber-600 hover:underline transition-all cursor-pointer">hello@mophethonline.com</span>
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
              <p className="text-[10px] text-neutral-400 mt-0.5">Monday &mdash; Sunday: 05:00 PM &ndash; 10:00 PM</p>
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
            {onNavigate && (
              <>
                <li>
                  <button 
                    onClick={() => onNavigate("/track")} 
                    className="hover:text-amber-650 hover:underline transition-colors text-left flex items-center gap-1.5 font-bold text-amber-600 tracking-wide uppercase text-[10px]"
                    id="footer-track-menu-link"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-500" />
                    <span>Order Tracking Menu</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate("/rider")} 
                    className="hover:text-amber-650 hover:underline transition-colors text-left flex items-center gap-1.5 text-neutral-500 hover:text-amber-605 tracking-wide uppercase text-[10px]"
                    id="footer-rider-link"
                  >
                    <span>Rider &amp; Courier Portal</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate("/terms")} 
                    className="hover:text-amber-650 hover:underline transition-colors text-left flex items-center gap-1.5 text-neutral-500 tracking-wide uppercase text-[10px]"
                    id="footer-terms-link"
                  >
                    <span>Terms &amp; Conditions</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate("/privacy")} 
                    className="hover:text-amber-650 hover:underline transition-colors text-left flex items-center gap-1.5 text-neutral-500 tracking-wide uppercase text-[10px]"
                    id="footer-privacy-link"
                  >
                    <span>Privacy Policy</span>
                  </button>
                </li>
              </>
            )}
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
              <span className="text-neutral-600 leading-relaxed font-sans font-medium">{addressText}</span>
            </p>
            
            {/* Premium Interactive Mini Map Frame */}
            <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm flex flex-col p-1">
              <div className="h-28 w-full relative overflow-hidden rounded-lg">
                <iframe 
                  src={mapEmbedUrl} 
                  className="absolute inset-0 w-full h-full border-0 select-none pointer-events-auto" 
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Footer Mini Navigation Map"
                ></iframe>
                {/* Visual shade overlay that disappears on hover */}
                <div className="absolute inset-0 bg-neutral-950/5 pointer-events-none group-hover:bg-transparent duration-300 transition-all" />
              </div>
              
              {/* Interactive Controls Bar */}
              <div className="p-1 px-1.5 flex items-center justify-between text-[9px] font-sans mt-1">
                <span className="font-semibold text-neutral-700 tracking-wider">LAGOS, NG</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsMapWidened(!isMapWidened)}
                    className="px-2 py-1 bg-amber-500 text-black font-extrabold tracking-tight rounded flex items-center gap-1 hover:bg-neutral-900 hover:text-white transition-all duration-200"
                    title="Widen Map below"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Widen Map</span>
                  </button>
                  <button 
                    onClick={() => setIsMapModalOpen(true)}
                    className="p-1 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-950 rounded transition-colors"
                    title="Fullscreen Lightbox"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Inline Widened Map Drawer */}
      {isMapWidened && (
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 mt-8 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Lekki Sanctuary Dynamic Navigation</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-light">{addressText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopyAddress} 
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-sans text-[11px] rounded flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy plus-code"}</span>
                </button>
                <a 
                  href="https://google.com/maps?q=CFRW+6W5+Ikate+Elegushi+Lekki" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-650 text-black font-semibold font-sans text-[11px] rounded flex items-center gap-1.5 transition-all text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
                <button 
                  onClick={() => setIsMapWidened(false)}
                  className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors ml-1"
                  title="Close Map"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-80 md:h-[400px] w-full relative">
              <iframe 
                src={mapEmbedUrl} 
                className="border-0 w-full h-full" 
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sleek Full Width Interactive Map of Ikate Lekki"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Full Screen Google Map Lightbox Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md animate-fadeIn" id="google-map-immersive-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
            <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                  <MapPin className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-sans">IMAX Interactive Navigation Stage</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Explore the environment around our Lekki Ikate Elegushi Sanctuary</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="p-2 hover:bg-neutral-850 rounded-full text-neutral-400 hover:text-white transition-all duration-200 cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 min-h-0 bg-neutral-950 relative">
              <iframe 
                src={mapEmbedUrl} 
                className="border-0 w-full h-full" 
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Fullscreen Immersive Map"
              ></iframe>
            </div>

            <div className="p-5 bg-neutral-950 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-neutral-300">
                <Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "12s" }} />
                <span className="font-semibold text-white">Address:</span>
                <span className="text-neutral-405">{addressText}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-sans">
                <button 
                  onClick={handleCopyAddress} 
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-lg flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Address"}</span>
                </button>
                <a 
                  href="https://google.com/maps?q=CFRW+6W5+Ikate+Elegushi+Lekki" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg flex items-center gap-2 transition-all font-bold text-xs text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Navigate Live</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corporate details line */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-neutral-400 text-center sm:text-left">
        <div>
          <p className="text-neutral-500 font-medium">&copy; 2026 Upside Restaurant &amp; Café. A Brand of Mopheth. All Rights Reserved.</p>
          {onNavigate && (
            <p className="mt-1 flex items-center justify-center sm:justify-start gap-4">
              <button 
                onClick={() => onNavigate("/terms")} 
                className="hover:text-amber-600 transition-colors cursor-pointer hover:underline uppercase tracking-wide text-[9px]"
                id="footer-terms-btn"
              >
                Terms &amp; Conditions
              </button>
              <span>|</span>
              <button 
                onClick={() => onNavigate("/privacy")} 
                className="hover:text-amber-600 transition-colors cursor-pointer hover:underline uppercase tracking-wide text-[9px]"
                id="footer-privacy-btn"
              >
                Privacy Policy
              </button>
            </p>
          )}
        </div>
        <div className="flex gap-6 uppercase tracking-widest text-[9px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Secure Checkout</span>
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
