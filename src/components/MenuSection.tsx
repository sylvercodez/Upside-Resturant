import React, { useState, useRef, useEffect } from "react";
import { Search, Heart, ShoppingBag, Check, Plus, Minus, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, MENU_ITEMS, MenuItem, Category } from "../data/menu";
import MenuImage from "./MenuImage";

interface MenuSectionProps {
  onAddToCart: (item: MenuItem, variant?: string, extras?: string[], notes?: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewAllMenu: () => void;
  menuItems?: MenuItem[];
  categories?: Category[];
}

export default function MenuSection({ onAddToCart, favorites, onToggleFavorite, onViewAllMenu, menuItems, categories }: MenuSectionProps) {
  const displayCategories = (categories || CATEGORIES).filter(c => !(c as any).disabled);
  const [selectedCategory, setSelectedCategory] = useState<string>("starter");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  // Variant/Option configuration state for modal
  const [chosenVariant, setChosenVariant] = useState<string>("");
  const [chosenExtras, setChosenExtras] = useState<string[]>([]);
  const [customItemNotes, setCustomItemNotes] = useState<string>("");

  // References for categories strip scroll
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Filter items based on selected category & search query
  const getFilteredItems = () => {
    let list = menuItems || MENU_ITEMS;

    // Filter out any items whose category is disabled
    const disabledCategoryIds = new Set((categories || CATEGORIES).filter(c => (c as any).disabled).map(c => c.id));
    list = list.filter(item => !disabledCategoryIds.has(item.category));

    // Search query match
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    } else {
      // Category match unless "best-sellers" is selected
      if (selectedCategory !== "best-sellers") {
        list = list.filter((item) => item.category === selectedCategory);
      } else {
        // "best-sellers" fallback: items tagged "Best Seller" or "Signature" or arbitrary selected
        list = list.filter((item) => item.tags?.includes("Best Seller") || item.tags?.includes("Signature"));
      }
    }

    // List of food categories to limit to 6 items on the home page
    const FOOD_CATEGORIES = [
      "starter", "sandwich", "breakfast", "pasta", "burger", 
      "grilled-steaks", "grilled-fish", "platters", "cookies", "pizza", "salad"
    ];

    if (FOOD_CATEGORIES.includes(selectedCategory) && searchQuery.trim().length === 0) {
      return list.slice(0, 6);
    }

    return list;
  };

  const filteredItems = getFilteredItems();

  // Reset variant choices when opening a new modal
  const handleOpenItemDetails = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setCustomItemNotes("");

    // Setup intelligent default variants
    if (item.category === "grills" || item.id.includes("steak") || item.id.includes("salmon")) {
      setChosenVariant("Medium Well Done");
    } else if (item.category === "breakfast" || item.id.includes("breakfast")) {
      setChosenVariant("Scrambled Eggs");
    } else if (item.category === "pasta" || item.id.includes("pasta")) {
      setChosenVariant("Authentic Tomato Base");
    } else if (item.category === "coffee" || item.id.includes("latte") || item.id.includes("cappuccino")) {
      setChosenVariant("Whole Milk");
    } else {
      setChosenVariant("");
    }

    setChosenExtras([]);
  };

  const handleToggleExtra = (extra: string) => {
    if (chosenExtras.includes(extra)) {
      setChosenExtras(chosenExtras.filter((e) => e !== extra));
    } else {
      setChosenExtras([...chosenExtras, extra]);
    }
  };

  const handleConfirmAddToCart = () => {
    if (selectedItemForModal) {
      onAddToCart(selectedItemForModal, chosenVariant || undefined, chosenExtras, customItemNotes);
      setSelectedItemForModal(null);
    }
  };

  // Quick direct add-to-cart (skipping variant configure unless critical)
  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Direct add with default setup depending on item category
    let val: string | undefined = undefined;
    if (item.category === "grills") val = "Medium Well Done";
    if (item.category === "breakfast") val = "Scrambled Eggs";
    if (item.category === "coffee") val = "Whole Milk";

    onAddToCart(item, val, [], "");
  };

  // Helper custom details based on active item category
  const renderItemOptions = (item: MenuItem) => {
    if (item.category === "grills" || item.id.includes("steak") || item.id.includes("salmon")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Steak Temperature / Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {["Medium Rare", "Medium", "Medium Well Done", "Fully Cooked / Well Done"].map((temp) => (
              <button
                key={temp}
                onClick={() => setChosenVariant(temp)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  chosenVariant === temp ? "border-amber-600 bg-amber-500/10 text-amber-700 font-bold" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {temp}
              </button>
            ))}
          </div>

          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider block mt-4">Choice of Included Side</label>
          <div className="grid grid-cols-2 gap-2">
            {["Mashed Potato", "Sweet Yam Fries", "Roasted Potato", "Native Steamed Rice"].map((side) => (
              <button
                key={side}
                onClick={() => setCustomItemNotes(`Included Side: ${side}`)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  customItemNotes.includes(side) ? "border-amber-600 bg-amber-500/10 text-amber-700 font-bold" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.category === "breakfast" || item.id.includes("breakfast")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">How would you like your eggs?</label>
          <div className="grid grid-cols-2 gap-2">
            {["Scrambled", "Sunny Side Up", "Well Fried / Over Easy", "Soft Eggs"].map((eggStyle) => (
              <button
                key={eggStyle}
                onClick={() => setChosenVariant(eggStyle)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  chosenVariant === eggStyle ? "border-amber-600 bg-amber-500/10 text-amber-700 font-bold" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {eggStyle}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.category === "coffee" || item.id.includes("latte") || item.id.includes("cappuccino")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Select Milk Base</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Whole Milk", price: 0 },
              { name: "Almond Milk", price: 1000 },
              { name: "Oat Milk", price: 1000 },
              { name: "Soy Milk", price: 800 }
            ].map((milkObj) => (
              <button
                key={milkObj.name}
                onClick={() => setChosenVariant(milkObj.name)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider text-left flex justify-between items-center ${
                  chosenVariant === milkObj.name ? "border-amber-600 bg-amber-500/10 text-amber-700 font-bold" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span>{milkObj.name}</span>
                {milkObj.price > 0 && <span className="text-neutral-500">+₦{milkObj.price.toLocaleString()}</span>}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Special Culinary Instructions</label>
        <textarea
          value={customItemNotes}
          onChange={(e) => setCustomItemNotes(e.target.value)}
          placeholder="E.g., No onions, specify spicy levels, or customize toppings..."
          className="w-full bg-neutral-50 border border-neutral-200 p-3 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-amber-500 h-24 font-mono"
        />
      </div>
    );
  };

  return (
    <section id="menu-fast" className="bg-white py-20 border-b border-neutral-200 px-4 md:px-8 text-neutral-900">
      <div className="max-w-[1800px] mx-auto">
        {/* Dynamic Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h2 className="text-sm font-mono tracking-[0.3em] text-amber-600 uppercase font-bold">
              Instant Ordering Platform
            </h2>
            <h3 className="text-3xl md:text-5xl font-sans font-extrabold tracking-tight text-neutral-900">
              The Upside <span className="font-serif italic text-amber-600 font-medium normal-case">Boutique Menu</span>
            </h3>
            <p className="text-xs text-neutral-600 max-w-md font-mono">
              Access curated chef specials, premium single origin beans, and cocktails within seconds. Tap to order.
            </p>
          </div>

          {/* Quick Search Filtering */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search dishes, cocktails, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400 text-xs py-3.5 pl-10 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10 font-mono tracking-wider transition-all"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-[10px] text-amber-600 hover:text-amber-800 font-mono cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* FAST MENU ACCESS - STICKY CATEGORIES STRIP WITH MOBILE SWIPE */}
        <div className="sticky top-20 z-30 bg-white/95 py-4 border-y border-neutral-200 -mx-4 px-4 overflow-hidden mb-12">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
            {/* Scroll Indicator (Mobile only) */}
            <div className="text-[10px] text-amber-600/75 font-mono tracking-wider animate-pulse whitespace-nowrap lg:hidden">
              Swipe Left/Right &rarr;
            </div>

            {/* Scrollable Container */}
            <div
              ref={categoriesScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full select-none"
              style={{ scrollbarWidth: "none" }}
            >
              {displayCategories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery(""); // clear search on category switch
                    }}
                    className={`px-5 py-3 text-xs font-mono tracking-widest uppercase flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer select-none rounded-none border ${
                      isActive
                        ? "bg-amber-500 text-black border-transparent font-semibold shadow-lg shadow-amber-500/10"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50/25"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Description Banner */}
        <div className="bg-amber-50/50 border-l-2 border-amber-500 px-6 py-4 mb-10">
          <p className="text-xs text-amber-800 font-mono tracking-wider uppercase font-bold">Active View</p>
          <p className="text-sm text-neutral-800 mt-1">
            {searchQuery
              ? `Search Results matching "${searchQuery}"`
              : displayCategories.find((c) => c.id === selectedCategory)?.description || ""}
          </p>
        </div>

        {/* Empty Search Response */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 border border-dashed border-neutral-200">
            <p className="text-sm font-mono text-neutral-500 mb-2">No masterfully crafted items match your filter.</p>
            <p className="text-xs text-amber-600 cursor-pointer font-bold" onClick={() => { setSelectedCategory("best-sellers"); setSearchQuery(""); }}>
              Reset search filters to explorer everything &rarr;
            </p>
          </div>
        )}

        {/* PREMIUM HIGH-CONTRAST GRID SYSTEM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-6" id="menu-items-grid">
          {filteredItems.map((item) => {
            const isLiked = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleOpenItemDetails(item)}
                className="group border border-neutral-900 bg-black hover:bg-neutral-950 transition-all duration-305 p-5 relative flex flex-col justify-between cursor-pointer h-full shadow-lg"
                id={`grid-item-${item.id}`}
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black mb-4">
                  {/* Absolute Badge tags */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
                    {item.tags?.map((tg, i) => (
                      <span
                        key={i}
                        className="bg-black/90 text-amber-400 text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 border border-amber-500/20"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>

                  {/* Absolute Like/Favorite Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-2 bg-black/80 hover:bg-neutral-900 text-neutral-400 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
                    id={`btn-favorite-${item.id}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>

                  <MenuImage
                    src={item.image}
                    name={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-100"
                    containerClassName="w-full h-full min-h-[160px]"
                    size="lg"
                  />
                </div>

                {/* Content Section */}
                <div className="space-y-2 flex-grow">
                  <div className="flex justify-between items-start gap-2 text-left">
                    <h4 className="text-base text-white font-sans tracking-tight font-light group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-sm font-semibold text-amber-500 font-mono tracking-wider whitespace-nowrap">
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed tracking-wide font-light text-left">
                    {item.description}
                  </p>
                </div>

                {/* Centered Wide Quick Add to Cart Button */}
                <button
                  onClick={(e) => handleQuickAdd(item, e)}
                  className="mt-6 w-full py-3.5 bg-amber-950/20 hover:bg-amber-500 border border-amber-500/20 hover:border-transparent text-amber-400 hover:text-black font-semibold text-xs font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer"
                  id={`quick-add-${item.id}`}
                >
                  Quick Add to Cart
                </button>
              </div>
            );
          })}
        </div>

        {/* Dynamic Link to Dedicated Premium Menu Page */}
        <div className="mt-16 text-center" id="view-all-menu-catalog-block">
          <button
            onClick={onViewAllMenu}
            className="px-10 py-4 bg-transparent border border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-semibold text-xs font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer inline-flex items-center gap-3 shadow-xl group border-2"
            id="view-all-dedicated-menu-btn"
          >
            <span>View All Items on Dedicated Menu Page</span>
            <span className="group-hover:translate-x-1 transition-transform font-bold">&rarr;</span>
          </button>
        </div>
      </div>

      {/* CULINARY VARIATION & EXTRAS DIALOG */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-lg overflow-y-auto max-h-[90vh] text-black">
            {/* Header banner */}
            <div className="relative h-48 bg-black">
              <img
                src={selectedItemForModal.image}
                alt={selectedItemForModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="absolute top-4 right-4 bg-black/80 p-2 text-white hover:text-amber-400 rounded-full cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="bg-amber-500 text-black text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 font-bold">
                  {selectedItemForModal.category.replace("-", " ")}
                </span>
                <h3 className="text-xl md:text-2xl text-white font-serif mt-1.5">{selectedItemForModal.name}</h3>
              </div>
            </div>

            {/* Form details */}
            <div className="p-6 space-y-6 bg-white text-left">
              <div className="flex justify-between items-center bg-amber-50 p-4 border border-amber-200/50">
                <span className="text-xs uppercase font-mono text-neutral-700 font-bold">Base Premium Price</span>
                <span className="text-lg font-mono font-bold text-amber-600">₦{selectedItemForModal.price.toLocaleString()}</span>
              </div>

              {/* Dynamic Option Renderer */}
              {renderItemOptions(selectedItemForModal)}

              {/* Extras checkbox layout if available */}
              <div className="space-y-3">
                <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider block font-bold">Add Decadent Extras</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "Extra Syrups / Honey", price: 1500 },
                    { name: "Single Shot Espresso", price: 3500 },
                    { name: "Whipped Cream Layer", price: 1500 },
                    { name: "Gourmet Avocado Portion", price: 2000 },
                    { name: "Fried Sweet Plantain Portion", price: 3000 }
                  ].map((x) => {
                    const hasSelected = chosenExtras.includes(x.name);
                    return (
                      <button
                        key={x.name}
                        onClick={() => handleToggleExtra(x.name)}
                        className={`flex items-center justify-between p-3 border text-xs font-mono select-none ${
                          hasSelected ? "border-amber-600 bg-amber-500/5 text-amber-700 animate-pulse font-bold" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 border flex items-center justify-center ${hasSelected ? "border-amber-500 bg-amber-500 text-black" : "border-neutral-300"}`}>
                            {hasSelected && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span>{x.name}</span>
                        </div>
                        <span className="text-neutral-500">+₦{x.price.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="w-full sm:w-1/3 py-3 border border-neutral-200 text-neutral-600 text-xs font-mono tracking-widest uppercase hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddToCart}
                  className="w-full sm:w-2/3 py-3 bg-black text-white font-semibold text-xs font-mono tracking-widest uppercase hover:bg-neutral-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Add to Order Bag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
