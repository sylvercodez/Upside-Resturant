import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Compass, Calendar, Flame, ChevronLeft, ChevronRight, ShoppingBag, QrCode } from "lucide-react";
import { MENU_ITEMS, MenuItem } from "../data/menu";
import MenuImage from "./MenuImage";
import gourmetDrinksHero from "../assets/images/gourmet_drinks_hero_1782059009940.jpg";

interface HeroProps {
  onExploreMenu: () => void;
  onBookTable: () => void;
  onOrderNow: () => void;
  onAddToCart?: (item: MenuItem) => void;
  menuItems?: MenuItem[];
}

// Simple weekly seed generator
const getWeeklySeed = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek);
  return year * 100 + week; // e.g. 202627
};

// Selection algorithm: 5 dishes, 1 drink
const getWeeklySignatures = (itemsList: MenuItem[]) => {
  const listToUse = itemsList && itemsList.length > 0 ? itemsList : MENU_ITEMS;

  const drinkCategories = [
    "coffee", "teas", "fruit-juice", "ice-coffee", "smoothie", 
    "frappuccino", "milkshake", "signature-drinks", "cocktail", "mocktail"
  ];
  
  // Filter dishes (excluding drinks, cookies, and extras to keep them as core lunch/dinner dishes)
  const foodItems = listToUse.filter(
    (item) => !drinkCategories.includes(item.category) && item.category !== "extras" && item.category !== "cookies"
  );
  const drinkItems = listToUse.filter((item) => drinkCategories.includes(item.category));

  const availableFoods = foodItems.length > 0 ? foodItems : listToUse;
  const availableDrinks = drinkItems.length > 0 ? drinkItems : listToUse;

  const seed = getWeeklySeed();
  
  // Simple LCG pseudo-random deterministic picker
  const selectDeterministic = (arr: MenuItem[], count: number, offsetSeed: number) => {
    const selected: MenuItem[] = [];
    const pool = [...arr];
    let currentSeed = seed + offsetSeed;
    
    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const x = Math.sin(currentSeed++) * 10000;
      const index = Math.floor((x - Math.floor(x)) * pool.length);
      selected.push(pool[index]);
      pool.splice(index, 1); // remove to ensure uniqueness
    }
    return selected;
  };

  const selectedDishes = selectDeterministic(availableFoods, 5, 200);
  const selectedDrinks = selectDeterministic(availableDrinks, 1, 800);

  return [...selectedDishes, ...selectedDrinks];
};

export default function Hero({ onExploreMenu, onBookTable, onOrderNow, onAddToCart, menuItems }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Stable calculation of weekly signature items
  const carouselItems = useMemo(() => {
    return getWeeklySignatures(menuItems || MENU_ITEMS).map((item, idx) => {
      const isDrink = [
        "coffee", "teas", "fruit-juice", "ice-coffee", "smoothie", 
        "frappuccino", "milkshake", "signature-drinks", "cocktail", "mocktail"
      ].includes(item.category);

      return {
        id: item.id,
        name: item.name,
        subtitle: item.description || "Freshly crafted luxury premium selection",
        price: item.price,
        image: item.image,
        tags: isDrink ? ["Weekly Drink Select", "Mixology Special"] : ["Weekly Signature", `Gourmet Dish #${idx + 1}`],
        rawItem: item
      };
    });
  }, [menuItems]);

  // Adjust active index if count changes
  useEffect(() => {
    if (activeSlide >= carouselItems.length) {
      setActiveSlide(0);
    }
  }, [carouselItems.length, activeSlide]);

  // Auto scroll progress
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000); // 5 seconds transition
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const handleNextSlide = () => {
    if (carouselItems.length === 0) return;
    setActiveSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const handlePrevSlide = () => {
    if (carouselItems.length === 0) return;
    setActiveSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  };

  const handleAddSignatureToCart = (item: MenuItem) => {
    if (onAddToCart && item) {
      onAddToCart(item);
    }
  };

  const currentSlideIndex = Math.min(activeSlide, Math.max(0, carouselItems.length - 1));
  const currentItem = carouselItems[currentSlideIndex];

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
      <div className="relative z-20 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Bold Copy & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Tagline label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500/30 rounded-full text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Redefining Lagos Culinary Aristocracy</span>
          </div>

          {/* Headline updated to match uniform display font */}
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
        {currentItem && (
          <div className="lg:col-span-5 hidden lg:block relative font-sans" id="hero-carousel-signature-showcase">
            <div className="relative border border-amber-900/30 bg-neutral-950/90 p-5 rounded-none shadow-2xl space-y-4">
              
              {/* Aspect card preview image with sliding transitions */}
              <div className="relative aspect-[4/3] overflow-hidden group">
                <div className="absolute top-3 left-3 z-10 bg-black/80 px-2.5 py-1 text-[9px] font-mono text-amber-400 tracking-wider uppercase border border-amber-500/30">
                  {currentItem.tags[0]}
                </div>
                
                <div className="absolute top-3 right-3 z-10 bg-black/80 px-2 py-1 text-[8px] font-mono text-neutral-400 tracking-widest uppercase border border-neutral-800">
                  {currentSlideIndex + 1} / {carouselItems.length}
                </div>

                <MenuImage
                  src={currentItem.image}
                  name={currentItem.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                  containerClassName="w-full h-full"
                  size="lg"
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
              <div className="flex justify-between items-start text-left min-h-[52px] gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-base text-white tracking-tight font-medium transition-colors uppercase">
                    {currentItem.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono line-clamp-2">
                    {currentItem.subtitle}
                  </p>
                </div>
                <div className="text-sm font-semibold text-amber-500 font-mono whitespace-nowrap">
                  ₦{currentItem.price.toLocaleString()}
                </div>
              </div>

              {/* Add to Cart Dispatch Trigger for Highlight Carousel */}
              <button
                onClick={() => handleAddSignatureToCart(currentItem.rawItem)}
                className="w-full py-3 bg-amber-950/50 border border-amber-500/20 text-xs text-amber-400 font-mono tracking-widest uppercase hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
                id={`hero-sig-add-${currentItem.id}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add Signature Item to Cart</span>
              </button>
            </div>

            {/* Carousel indicators/progress dots under card */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 transition-all duration-300 rounded-none ${
                    currentSlideIndex === i ? "w-6 bg-amber-500" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
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
        )}
      </div>
    </section>
  );
}
