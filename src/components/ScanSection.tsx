import React from "react";
import { ArrowRight, Smartphone } from "lucide-react";

interface ScanSectionProps {
  onViewMenu?: () => void;
}

export default function ScanSection({ onViewMenu }: ScanSectionProps) {
  return (
    <section id="qr-ordering-section" className="max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-12 scroll-mt-24">
      <div className="relative border border-neutral-200 bg-neutral-50 p-6 md:p-10 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Text details column */}
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono uppercase block">
                Scan & Taste
              </span>
              <h2 className="text-2xl md:text-3xl text-neutral-950 font-serif font-light leading-tight">
                Browse Menu & Order <br />Directly on Your Phone
              </h2>
              <p className="text-neutral-600 font-mono text-xs max-w-lg mt-3 leading-relaxed">
                Join our distinguished guests using our integrated smartphone experiences. Scanning our physical or digital QR codes loads our full, authentic Lagos culinary offerings with express secure checkout instantly on your mobile browser.
              </p>
            </div>

            {/* Instructions steps */}
            <div className="space-y-4 pt-1">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</div>
                <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                  Open your smartphone's built-in camera or QR scanner.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</div>
                <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                  Point the lens at the QR code shown to lock and sync.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</div>
                <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                  Tap the recognized link to customize, add selections to your basket, and trigger local secure fulfillment.
                </p>
              </div>
            </div>

            {/* Optional click-through call to action button */}
            {onViewMenu && (
              <div className="pt-2">
                <button
                  onClick={onViewMenu}
                  className="group px-4 py-3 bg-neutral-950 hover:bg-amber-600 hover:text-black text-white font-mono text-[9px] sm:text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow whitespace-nowrap"
                >
                  <span>View Digital Menu Online</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* QR Code Presentation Box */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-white border border-neutral-200 p-6 md:p-8 space-y-4 shadow-sm relative">
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-neutral-950 text-white border border-neutral-800 font-mono text-[8px] uppercase tracking-widest px-3 py-1">
              Live Store Sync
            </div>

            {/* QR Frame Container */}
            <div className="relative p-3 bg-neutral-50 border-2 border-dashed border-neutral-200 group hover:border-amber-500/55 transition-colors">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://upside-restaurant-cafe.com/menu&color=000000"
                alt="Upside Menu Direct Scan QR Code"
                className="w-40 h-40 md:w-48 bg-white border border-neutral-200"
                referrerPolicy="no-referrer"
              />
              
              {/* Micro tech corners around the picture */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-600" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-600" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-600" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-600" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] font-sans font-bold text-neutral-900 tracking-wider uppercase flex items-center justify-center gap-1.5 animate-pulse">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Scan to order on mobile</span>
              </p>
              <p className="text-[8.5px] text-neutral-500 font-mono uppercase tracking-widest">
                Secure Connection &bull; Upside Hospitality
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
