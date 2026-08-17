import React, { useState, useEffect } from "react";
import { resolveItemImage, mapTitleToImageUrl } from "../utils/menu";

interface MenuImageProps {
  src?: string;
  name: string;
  category?: string;
  className?: string;
  containerClassName?: string;
  alt?: string;
  size?: "sm" | "md" | "lg"; // sm for cart/dashboard list, lg for main menus
}

export default function MenuImage({
  src,
  name,
  category,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full",
  alt,
  size = "lg"
}: MenuImageProps) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  // Determine initial effective image URL
  useEffect(() => {
    setHasError(false);
    const resolved = resolveItemImage(src, name, category);
    setCurrentSrc(resolved);
  }, [src, name, category]);

  const handleImageError = () => {
    // If the custom src failed, try our fallback map once before falling back to initials
    const fallbackUrl = mapTitleToImageUrl(name, undefined, category);
    if (currentSrc !== fallbackUrl && fallbackUrl) {
      setCurrentSrc(fallbackUrl);
    } else {
      setHasError(true);
    }
  };

  // Premium ambient dark gradients for initials fallback
  const gradients = [
    "from-[#2a1708] to-[#0e0702] text-amber-100/90 border-amber-900/40",
    "from-[#1c1c1c] to-[#0a0a0a] text-neutral-300/90 border-neutral-800/40",
    "from-[#2c120a] to-[#0f0502] text-orange-100/90 border-orange-950/45",
    "from-[#161d16] to-[#060806] text-emerald-100/90 border-emerald-950/40",
    "from-[#141a29] to-[#06080d] text-blue-100/90 border-blue-950/40",
    "from-[#221026] to-[#0a040d] text-purple-100/90 border-purple-950/40",
    "from-[#242416] to-[#0d0d07] text-yellow-100/90 border-yellow-950/40"
  ];

  const getGradientIndex = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % gradients.length;
  };

  const gradientClass = gradients[getGradientIndex(name || "Item")];

  const getInitials = (str: string) => {
    const parts = (str || "").trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (str || "MM").substring(0, 2).toUpperCase();
  };

  if (hasError || !currentSrc) {
    const initials = getInitials(name);
    
    if (size === "sm") {
      // Small compact container (e.g. cart items, admin table row list)
      return (
        <div 
          className={`flex items-center justify-center bg-gradient-to-br ${gradientClass} border font-mono select-none ${containerClassName}`}
          title={name}
        >
          <span className="text-xs font-bold tracking-wider">{initials}</span>
        </div>
      );
    }

    // Medium or Large cards (e.g. menu gallery item cards)
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 bg-gradient-to-br ${gradientClass} border font-mono select-none relative overflow-hidden text-center group ${containerClassName}`}
      >
        {/* Decorative thin structural outline */}
        <div className="absolute inset-2 border border-white/[0.03] pointer-events-none" />
        
        {/* Watermark icon/initials in the background */}
        <div className="absolute -bottom-4 -right-4 text-white/[0.02] text-7xl font-sans font-black pointer-events-none select-none uppercase">
          {initials}
        </div>

        <div className="space-y-2 z-10">
          <span className="text-[10px] tracking-[0.25em] text-amber-500/70 uppercase block font-mono">
            UPSIDE CULINARY
          </span>
          <h5 className="text-xs md:text-sm font-sans font-light tracking-widest text-white/95 uppercase max-w-[170px] mx-auto leading-relaxed group-hover:text-amber-400 transition-colors">
            {name}
          </h5>
          <div className="w-4 h-[1px] bg-amber-500/30 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden relative ${containerClassName} flex items-center justify-center`}>
      <img
        src={currentSrc}
        alt={alt || name}
        className={`${className} w-full h-full object-cover`}
        onError={handleImageError}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
