import React from "react";
import { ArrowRight, Compass, Calendar, Flame } from "lucide-react";

interface HeroProps {
  onExploreMenu: () => void;
  onBookTable: () => void;
  onOrderNow: () => void;
}

export default function Hero({ onExploreMenu, onBookTable, onOrderNow }: HeroProps) {
  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center justify-center bg-black overflow-hidden py-16 px-4">
      {/* Background cinematic visuals with gradient styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />
        <img
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1600"
          alt="Premium Lagos Gastronomy"
          className="w-full h-full object-cover object-center scale-105 animate-[pulse_8s_infinite] opacity-65"
        />
      </div>

      {/* Main Container Content */}
      <div className="relative z-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Bold Copy & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Tagline label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500/30 rounded-full text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Redefining Lagos Culinary Aristocracy</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-light tracking-tight text-white leading-[1.05]">
            Every Cup, <br className="hidden md:inline" />
            Every Plate — <br />
            <span className="font-serif italic text-amber-500 font-medium">
              A Pleasure Refined
            </span>
          </h1>

          {/* Core Descriptive Copy */}
          <p className="max-w-lg text-neutral-300 text-sm md:text-base leading-relaxed tracking-wide font-light">
            Indulge in Upside's luxury dining and state-of-the-art cafe sanctuary. 
            Blending high-voltage Lagos energy with fine gourmet craftsmanship, select robust African grains, and international prime grills.
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            {/* Primary Action Button: Order Instantly */}
            <button
              onClick={onOrderNow}
              className="px-8 py-4 bg-amber-500 text-black font-semibold text-xs tracking-widest font-mono uppercase hover:bg-amber-400 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-amber-950/40 cursor-pointer"
            >
              <span>Order Now</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Action: Explore Menu */}
            <button
              onClick={onExploreMenu}
              className="px-8 py-4 bg-transparent border border-white text-white font-semibold text-xs tracking-widest font-mono uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Compass className="w-4.5 h-4.5" />
              <span>Explore Menu</span>
            </button>

            {/* Tertiary Action: Reservations */}
            <button
              onClick={onBookTable}
              className="px-8 py-4 bg-neutral-900/80 border border-amber-500/30 text-amber-400 font-semibold text-xs tracking-widest font-mono uppercase hover:bg-amber-500 hover:text-black hover:border-transparent transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Calendar className="w-4.5 h-4.5" />
              <span>Book Table</span>
            </button>
          </div>

          {/* Brand Promise Labels */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 pt-8 border-t border-neutral-900 w-full max-w-lg">
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white font-serif">100%</div>
              <div className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase mt-1">Single-Origin Arabica</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white font-serif">Prime</div>
              <div className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase mt-1">Dry-Aged Ribeyes</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-semibold text-white font-serif">Lagos</div>
              <div className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase mt-1">Finest Vibe</div>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Interactive Floating Product Card Showcase */}
        <div className="lg:col-span-5 hidden lg:block relative">
          <div className="relative border border-amber-900/30 bg-neutral-950/90 p-5 rounded-none shadow-2xl space-y-4">
            {/* Aspect card preview image */}
            <div className="relative aspect-[4/3] overflow-hidden group">
              <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 text-[9px] font-mono text-amber-400 tracking-wider uppercase border border-amber-500/30">
                Signature Dish
              </div>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"
                alt="Classic Mopheth Burger"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Visual description */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base text-white tracking-tight font-medium">Classic Mopheth Burger</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">Double Beef + Sunny Side Egg + Bacon</p>
              </div>
              <div className="text-sm font-semibold text-amber-500 font-mono">
                ₦15,200
              </div>
            </div>
            <button
              onClick={onOrderNow}
              className="w-full py-2.5 bg-amber-950/50 border border-amber-500/20 text-xs text-amber-400 font-mono tracking-wider hover:bg-amber-500 hover:text-black transition-colors"
            >
              Quick Add to Cart
            </button>
          </div>

          {/* Absolute floating subtle design badge */}
          <div className="absolute -bottom-6 -left-6 bg-amber-500 text-black px-4 py-4 rounded-none font-sans font-black flex flex-col items-center justify-center shadow-lg uppercase leading-none select-none rotate-3">
            <span className="text-[10px] font-mono tracking-widest">Premium</span>
            <span className="text-lg">Fresh</span>
            <span className="text-[9px] font-mono tracking-wider">Lagos Style</span>
          </div>
        </div>
      </div>
    </section>
  );
}
