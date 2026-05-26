import React from "react";
import { ShoppingBag, Phone, MapPin, Calendar, Heart } from "lucide-react";

interface HeaderProps {
  onOpenCart: () => void;
  onScrollToElement: (elementId: string) => void;
  cartCount: number;
  onOpenReservations: () => void;
  favoritesCount: number;
}

export default function Header({
  onOpenCart,
  onScrollToElement,
  cartCount,
  onOpenReservations,
  favoritesCount
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/95 border-b border-yellow-900/30 backdrop-blur-md">
      {/* Top Banner with high-end alert context */}
      <div className="bg-amber-950/40 border-b border-amber-900/25 px-4 py-2 text-center text-xs text-amber-200/90 font-mono tracking-wider flex items-center justify-between sm:justify-center gap-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-500 animate-pulse" />
          <span>32A, Admiralty Way, Lekki Phase 1, Lagos</span>
        </div>
        <div className="hidden sm:block text-amber-500/60">|</div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-sans font-semibold text-white">0911-464-6767</span>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Logo / Premium branding identity */}
        <button
          onClick={() => onScrollToElement("hero")}
          className="flex flex-col items-start select-none group text-left cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <span className="text-xl md:text-2xl font-black text-white tracking-widest font-sans group-hover:text-amber-500 transition-colors uppercase">
              UPSIDE
            </span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
          </div>
          <span className="text-[9px] font-mono tracking-[0.3em] text-neutral-400 group-hover:text-neutral-200 transition-colors uppercase">
            RESTAURANT & CAFÉ
          </span>
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-widest text-neutral-300 font-mono uppercase">
          <button
            onClick={() => onScrollToElement("menu-fast")}
            className="hover:text-amber-500 transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-500 hover:after:w-full after:transition-all"
          >
            Our Menu
          </button>
          <button
            onClick={() => onScrollToElement("experience")}
            className="hover:text-amber-500 transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-500 hover:after:w-full after:transition-all"
          >
            The Experience
          </button>
          <button
            onClick={() => onScrollToElement("reviews")}
            className="hover:text-amber-500 transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-500 hover:after:w-full after:transition-all"
          >
            Guest Reviews
          </button>
        </nav>

        {/* Action Widgets */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Reserve Table CTA (Desktop) */}
          <button
            onClick={onOpenReservations}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-transparent border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black transition-all rounded-none text-xs tracking-widest font-mono uppercase cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book a Table</span>
          </button>

          {/* Quick Favourites Indicator */}
          {favoritesCount > 0 && (
            <button
              onClick={() => onScrollToElement("menu-fast")}
              className="p-2 text-rose-500/90 hover:text-rose-500 rounded-full transition-colors relative"
              title="Liked Items"
            >
              <Heart className="w-5 h-5 fill-rose-500 animate-bounce" />
              <span className="absolute -top-1 -right-1 bg-white text-rose-600 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg">
                {favoritesCount}
              </span>
            </button>
          )}

          {/* Luxury Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="p-3 bg-amber-950/40 border border-amber-900/50 hover:border-amber-500 hover:bg-amber-500 hover:text-black text-amber-200 transition-all rounded-none relative flex items-center justify-center gap-2 cursor-pointer group"
          >
            <ShoppingBag className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-[10px] tracking-widest font-mono uppercase font-semibold">
              Cart
            </span>
            <div className="bg-amber-500 group-hover:bg-black text-black group-hover:text-amber-400 font-sans text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors">
              {cartCount}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
