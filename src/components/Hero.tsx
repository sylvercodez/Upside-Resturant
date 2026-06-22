import React, { useState, useEffect } from "react";
import { ArrowRight, Compass, Calendar, Flame, ChevronLeft, ChevronRight, ShoppingBag, QrCode } from "lucide-react";
import { MENU_ITEMS, MenuItem } from "../data/menu";

const gourmetDrinksHero = "/src/assets/images/gourmet_drinks_hero_1782059009940.jpg";

interface HeroProps {
  onExploreMenu: () => void;
  onBookTable: () => void;
  onOrderNow: () => void;
  onAddToCart?: (item: MenuItem) => void;
}

const CAROUSEL_SIGNATURES = [
  {
    id: "mopheth-burger",
    name: "Classic Mopheth Burger",
    subtitle: "Double Beef + Sunny Side Egg + Bacon",
    price: 15200,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Dish", "Chef Special"]
  },
  {
    id: "ribeye-steak-house",
    name: "Gourmet Ribeye Steak",
    subtitle: "350g Prime Dry-Aged Beef",
    price: 32500,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Grill", "Prime Cut"]
  },
  {
    id: "seafood-pasta",
    name: "Seafood Pasta Especial",
    subtitle: "Linguine + Scallops + Calamari + Shrimp",
    price: 21000,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Pasta", "Seafood Delight"]
  },
  {
    id: "lemon-butter-salmon",
    name: "Lemon Butter Salmon",
    subtitle: "Pan-Seared Fillet + Roasted Garlic",
    price: 25500,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Fusion", "Luxury Seared"]
  }
];

export default function Hero({ onExploreMenu, onBookTable, onOrderNow, onAddToCart }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto scroll matching dish progress
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SIGNATURES.length);
    }, 4000); // 4 seconds transition
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % CAROUSEL_SIGNATURES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? CAROUSEL_SIGNATURES.length - 1 : prev - 1));
  };

  const handleAddSignatureToCart = (itemId: string) => {
    const matchingItem = MENU_ITEMS.find((m) => m.id === itemId);
    if (matchingItem && onAddToCart) {
      onAddToCart(matchingItem);
    }
  };

  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center justify-center bg-neutral-950 overflow-hidden py-16 px-4">
      {/* Background cinematic visuals with gradient styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/35 z-10" />
        <img
          src={gourmetDrinksHero}
          alt="Premium Boutique Bar Drinks"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 animate-[pulse_10s_infinite] opacity-85"
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

          {/* Headline updated to match uniform display font: identical font-sans layout to render large */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight text-white leading-[1.05]" id="hero-main-title">
            Every Cup, <br className="hidden md:inline" />
            Every Plate — <br />
            <span className="text-amber-500 font-sans font-extrabold block mt-2 text-3xl md:text-5xl lg:text-6xl uppercase tracking-tighter">
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

            {/* Secondary Action: Scan Menu */}
            <button
              onClick={onExploreMenu}
              className="px-8 py-4 bg-transparent border border-white text-white font-semibold text-xs tracking-widest font-mono uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>Scan Menu</span>
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

        {/* Right Column: Premium Dynamic Signature Dish Carousel Showcase */}
        <div className="lg:col-span-5 hidden lg:block relative font-sans" id="hero-carousel-signature-showcase">
          <div className="relative border border-amber-900/30 bg-neutral-950/90 p-5 rounded-none shadow-2xl space-y-4">
            
            {/* Aspect card preview image with sliding transitions */}
            <div className="relative aspect-[4/3] overflow-hidden group">
              <div className="absolute top-3 left-3 z-10 bg-black/80 px-2.5 py-1 text-[9px] font-mono text-amber-400 tracking-wider uppercase border border-amber-500/30">
                {CAROUSEL_SIGNATURES[activeSlide].tags[0]}
              </div>
              
              <div className="absolute top-3 right-3 z-10 bg-black/80 px-2 py-1 text-[8px] font-mono text-neutral-400 tracking-widest uppercase border border-neutral-800">
                {activeSlide + 1} / {CAROUSEL_SIGNATURES.length}
              </div>

              <img
                src={CAROUSEL_SIGNATURES[activeSlide].image}
                alt={CAROUSEL_SIGNATURES[activeSlide].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                referrerPolicy="no-referrer"
              />

              {/* Float Slide Navigation Overlays */}
              <button
                onClick={handlePrevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/90 hover:bg-amber-500 hover:text-black text-amber-400 p-1.5 border border-amber-500/25 transition-colors z-20 cursor-pointer"
                title="Previous Signature Dish"
                id="hero-sig-nav-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/90 hover:bg-amber-500 hover:text-black text-amber-400 p-1.5 border border-amber-500/25 transition-colors z-20 cursor-pointer"
                title="Next Signature Dish"
                id="hero-sig-nav-next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Visual description */}
            <div className="flex justify-between items-start text-left min-h-[52px]">
              <div className="space-y-0.5">
                <h3 className="text-base text-white tracking-tight font-medium transition-colors">
                  {CAROUSEL_SIGNATURES[activeSlide].name}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {CAROUSEL_SIGNATURES[activeSlide].subtitle}
                </p>
              </div>
              <div className="text-sm font-semibold text-amber-500 font-mono whitespace-nowrap">
                ₦{CAROUSEL_SIGNATURES[activeSlide].price.toLocaleString()}
              </div>
            </div>

            {/* Add to Cart Dispatch Trigger for Highlight Carousel */}
            <button
              onClick={() => handleAddSignatureToCart(CAROUSEL_SIGNATURES[activeSlide].id)}
              className="w-full py-3 bg-amber-950/50 border border-amber-500/20 text-xs text-amber-400 font-mono tracking-widest uppercase hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
              id={`hero-sig-add-${CAROUSEL_SIGNATURES[activeSlide].id}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add Signature Item to Cart</span>
            </button>
          </div>

          {/* Carousel indicators/progress dots under card */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {CAROUSEL_SIGNATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 transition-all duration-300 rounded-none ${
                  activeSlide === i ? "w-6 bg-amber-500" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
                }`}
                title={`Go to Signature ${i + 1}`}
                id={`hero-sig-dot-${i}`}
              />
            ))}
          </div>

          {/* Absolute floating luxury layout design stamp */}
          <div className="absolute -bottom-6 -left-6 bg-amber-500 text-black px-4 py-4 rounded-none font-sans font-black flex flex-col items-center justify-center shadow-lg uppercase leading-none select-none rotate-3">
            <span className="text-[10px] font-mono tracking-widest">Premium</span>
            <span className="text-lg">Fresh</span>
            <span className="text-[9px] font-mono tracking-wider font-extrabold">Lagos Style</span>
          </div>
        </div>
      </div>
    </section>
  );
}
