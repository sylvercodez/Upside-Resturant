import React from "react";
import { Coffee, Utensils, Calendar, ShoppingBag, Heart, User } from "lucide-react";

interface BottomNavProps {
  onOpenCart: () => void;
  onOpenReservations: () => void;
  onScrollToElement: (elementId: string) => void;
  cartCount: number;
  favoritesCount: number;
}

export default function BottomNav({
  onOpenCart,
  onOpenReservations,
  onScrollToElement,
  cartCount,
  favoritesCount
}: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-amber-900/35 backdrop-blur-md px-4 py-2.5 flex items-center justify-around shadow-2xl">
      
      {/* Home / Lobby Trigger */}
      <button
        onClick={() => onScrollToElement("hero")}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Utensils className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
        <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">Lobby</span>
      </button>

      {/* Menu scroll trigger */}
      <button
        onClick={() => onScrollToElement("menu-fast")}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Coffee className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
        <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">Menu</span>
      </button>

      {/* Book table directly */}
      <button
        onClick={onOpenReservations}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
      >
        <Calendar className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" />
        <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">Reserve</span>
      </button>

      {/* Favorites list count badge if liked */}
      <button
        onClick={() => onScrollToElement("menu-fast")}
        className="flex flex-col items-center justify-center gap-1 text-center group cursor-pointer relative"
      >
        <Heart className={`w-5 h-5 ${favoritesCount > 0 ? "text-rose-500 fill-rose-500" : "text-neutral-400"}`} />
        <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">Favorites</span>
        {favoritesCount > 0 && (
          <span className="absolute -top-1 right-2 bg-rose-500 text-white font-sans text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {favoritesCount}
          </span>
        )}
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
