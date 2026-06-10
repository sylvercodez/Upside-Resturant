import React from "react";
import { Coffee, Utensils, Calendar, ShoppingBag, Heart, User } from "lucide-react";

interface BottomNavProps {
  onOpenCart: () => void;
  onOpenReservations: () => void;
  onScrollToElement: (elementId: string) => void;
  cartCount: number;
  favoritesCount: number;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  currentUser?: any;
  onAuthClick?: () => void;
}

export default function BottomNav({
  onOpenCart,
  onOpenReservations,
  onScrollToElement,
  cartCount,
  favoritesCount,
  currentPath = "/",
  onNavigate,
  currentUser,
  onAuthClick
}: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-amber-900/35 backdrop-blur-md px-4 py-2.5 flex items-center justify-around shadow-2xl">
      
      {/* Home / Lobby Trigger */}
      <button
        onClick={() => onNavigate ? onNavigate("/") : onScrollToElement("hero")}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Utensils className={`w-5 h-5 transition-colors ${currentPath === "/" ? "text-amber-500" : "text-neutral-400 group-hover:text-amber-500"}`} />
        <span className={`text-[9px] font-mono tracking-wider uppercase ${currentPath === "/" ? "text-amber-500 font-semibold" : "text-neutral-500"}`}>Lobby</span>
      </button>

      {/* Menu scroll trigger */}
      <button
        onClick={() => onNavigate ? onNavigate("/menu") : onScrollToElement("menu-fast")}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Coffee className={`w-5 h-5 transition-colors ${currentPath === "/menu" ? "text-amber-500" : "text-neutral-400 group-hover:text-amber-500"}`} />
        <span className={`text-[9px] font-mono tracking-wider uppercase ${currentPath === "/menu" ? "text-amber-500 font-semibold" : "text-neutral-500"}`}>Menu</span>
      </button>

      {/* Book table directly */}
      <button
        onClick={onOpenReservations}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Calendar className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
        <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">Reserve</span>
      </button>

      {/* Dashboard Trigger */}
      <button
        onClick={() => currentUser ? (onNavigate && onNavigate("/dashboard")) : (onAuthClick && onAuthClick())}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer relative"
        id="mobile-bottomnav-account-dashboard"
      >
        <User className={`w-5 h-5 transition-colors ${currentPath === "/dashboard" ? "text-amber-500" : "text-neutral-400 group-hover:text-amber-500"}`} />
        <span className={`text-[9px] font-mono tracking-wider uppercase ${currentPath === "/dashboard" ? "text-amber-500 font-semibold" : "text-neutral-400"}`}>
          {currentUser ? "Account" : "Login"}
        </span>
      </button>

      {/* Floating cart bag on the mobile right */}
      <button
        onClick={onOpenCart}
        className="flex flex-col items-center justify-center gap-1 text-center group relative cursor-pointer"
      >
        <div className="relative p-2 bg-amber-500 rounded-none -mt-6 shadow-xl border border-black group-hover:bg-amber-400 transition-colors">
          <ShoppingBag className="w-5 h-5 text-black" />
          <span className="absolute -top-1 -right-1 bg-black text-amber-400 font-sans text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </div>
        <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase font-semibold mt-1">Bag</span>
      </button>

    </div>
  );
}
