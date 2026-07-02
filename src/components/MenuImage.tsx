import React, { useState } from "react";

interface MenuImageProps {
  src?: string;
  name: string;
  className?: string;
  containerClassName?: string;
  alt?: string;
  size?: "sm" | "md" | "lg"; // sm for cart/dashboard list, lg for main menus
}

export default function MenuImage({
  src,
  name,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full",
  alt,
  size = "lg"
}: MenuImageProps) {
  const [hasError, setHasError] = useState(false);

  // Premium, high-contrast twilight & ambient dark gradients
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

  const gradientClass = gradients[getGradientIndex(name)];

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const hasNoImage = !src || src.trim() === "" || src === "none" || src === "null" || src === "undefined";

  if (hasNoImage || hasError) {
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
        <div className="absolute -bottom-4 -right-4 text-white/[0.02] text-7xl font-sans font-black pointer-events-none select-none select-none uppercase">
          {initials}
        </div>

        <div className="space-y-2 z-10">
          <span className="text-[10px] tracking-[0.25em] text-amber-500/70 uppercase block font-mono">
            CULINARY SANCTUM
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
    <img
      src={src}
      alt={alt || name}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
