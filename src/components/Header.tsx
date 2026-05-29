import React from "react";
import { ShoppingBag, Phone, MapPin, Calendar, Heart, User, LogOut } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  onOpenCart: () => void;
  onScrollToElement: (elementId: string) => void;
  cartCount: number;
  onOpenReservations: () => void;
  favoritesCount: number;
  branding?: {
    logoSvg: string;
    brandName: string;
    tagline: string;
    subText: string;
  } | null;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  currentUser?: FirebaseUser | null;
  onAuthClick?: () => void;
  onLogout?: () => void;
}

export default function Header({
  onOpenCart,
  onScrollToElement,
  cartCount,
  onOpenReservations,
  favoritesCount,
  branding,
  currentPath = "/",
  onNavigate,
  currentUser,
  onAuthClick,
  onLogout
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-24 md:h-28 flex items-center justify-between">
        {/* Logo / Premium branding identity */}
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate("/");
            } else {
              onScrollToElement("hero");
            }
          }}
          className="flex items-center select-none group text-left cursor-pointer"
        >
          {branding?.logoSvg ? (
            <div 
              className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-md shadow-xl overflow-hidden flex items-center justify-center p-0.5 border border-neutral-200/40 flex-shrink-0 hover:scale-[1.03] transition-transform duration-300"
              style={{ contentVisibility: "auto" }}
              dangerouslySetInnerHTML={{ __html: branding.logoSvg }}
            />
          ) : (
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-lg md:text-xl font-black text-white tracking-widest font-sans group-hover:text-amber-500 transition-colors uppercase">
                  UPSIDE
                </span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              </div>
              <span className="text-[9px] font-mono tracking-[0.3em] text-neutral-400 group-hover:text-neutral-200 transition-colors uppercase">
                RESTAURANT &amp; CAFÉ
              </span>
            </div>
          )}
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-widest font-mono uppercase">
          <button
            onClick={() => onNavigate ? onNavigate("/menu") : onScrollToElement("menu-fast")}
            className={`transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-amber-500 after:transition-all ${
              currentPath === "/menu"
                ? "text-amber-500 after:w-full"
                : "text-neutral-300 hover:text-amber-500 after:w-0 hover:after:w-full"
            }`}
          >
            Our Menu
          </button>
          <button
            onClick={() => onNavigate ? onNavigate("/experience") : onScrollToElement("experience")}
            className={`transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-amber-500 after:transition-all ${
              currentPath === "/experience"
                ? "text-amber-500 after:w-full"
                : "text-neutral-300 hover:text-amber-500 after:w-0 hover:after:w-full"
            }`}
          >
            The Experience
          </button>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate("/");
                setTimeout(() => {
                  const element = document.getElementById("reviews");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              } else {
                onScrollToElement("reviews");
              }
            }}
            className="text-neutral-300 hover:text-amber-500 transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-amber-500 hover:after:w-full after:transition-all"
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

          {/* Authentic Firebase Authentication Gate */}
          {currentUser ? (
            <div className="flex items-center bg-neutral-900/85 border border-neutral-800" id="header-user-status-container">
              <button 
                onClick={() => onNavigate ? onNavigate("/dashboard") : (onAuthClick && onAuthClick())}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800/60 transition-colors text-left cursor-pointer" 
                id="header-user-status-strip"
                title="Open Dashboard & Order History"
              >
                <div className="w-8 h-8 bg-amber-600 text-white flex items-center justify-center font-mono text-[10px] font-extrabold uppercase shadow-inner">
                  {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : currentUser.email?.slice(0, 2).toUpperCase() || "AC"}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split("@")[0] || "Account"}
                  </span>
                  <span className="text-[9px] font-mono text-amber-500 font-semibold uppercase tracking-wider">
                    Dashboard
                  </span>
                </div>
              </button>
              <button
                onClick={onLogout}
                className="p-3 text-neutral-400 hover:text-amber-500 border-l border-neutral-800 transition-colors cursor-pointer"
                title="Sign Out of UPSIDE"
                id="header-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-950/20 border border-amber-900/30 hover:border-amber-500/70 text-amber-400 hover:bg-amber-500 hover:text-black transition-all text-[10px] tracking-widest font-mono uppercase cursor-pointer"
              id="header-login-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Join / Log In</span>
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
