import React, { useState } from "react";
import { REVIEWS } from "../data/menu";
import { Award, Compass, Heart, Share2, Star, Mail, MapPin, Instagram, Sparkles, Gift } from "lucide-react";

interface AboutAndReviewsProps {
  onReadMoreExperience: () => void;
}

export default function AboutAndReviews({ onReadMoreExperience }: AboutAndReviewsProps) {
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleShareReview = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="bg-white text-black space-y-20 pt-20 pb-20">

      {/* THE ABOUT BRAND STORY & HERITAGE */}
      <section id="experience" className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Rich visual story grid (Bento Grid Style) */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden border border-neutral-900 bg-black">
              <img
                src="https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=600"
                alt="Finest latte art pouring"
                className="w-full h-full object-cover grayscale filter brightness-[1.65] contrast-[1.25] hover:brightness-[1.1] transition-all duration-700"
              />
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-2 rounded-none shadow-sm">
              <Award className="w-6 h-6 text-amber-600" />
              <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-900 uppercase">Premium Ingredients</h4>
              <p className="text-[10px] text-neutral-600 font-mono">
                From organic coffee crops to prime steaks shipped weekly.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-10">
            <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-2 rounded-none shadow-sm">
              <Compass className="w-6 h-6 text-amber-600" />
              <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-900 uppercase">Lagos Vibe Sanctuary</h4>
              <p className="text-[10px] text-neutral-600 font-mono">
                Pioneering fine nightlife dining fused with elite daytime workspace.
              </p>
            </div>
            <div className="aspect-[3/4] overflow-hidden border border-neutral-900 bg-black">
              <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"
                alt="Elite flame-grilled steaks"
                className="w-full h-full object-cover grayscale filter brightness-[1.65] contrast-[1.25] hover:brightness-[1.1] transition-all duration-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Copy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className="text-xs font-mono tracking-[0.3em] text-amber-600 uppercase block">
            The Signature Vibe
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-light tracking-tight text-neutral-950 leading-tight">
            Elevating Contemporary <br />
            <span className="font-serif italic text-amber-600">African Hospitality</span>
          </h2>
          
          <div className="space-y-4 text-xs md:text-sm text-neutral-700 font-mono tracking-wide leading-relaxed font-light font-sans">
            <p>
              Born from a pursuit to bridge premium artisan coffee culture with world-class nocturnal fine dining, <span className="text-neutral-900 font-semibold font-sans">Upside Restaurant & Café</span> has quickly defined the skyline of Lekki’s gourmet arena.
            </p>
            <p>
              We pride ourselves on the meticulous curation of dual identity: during sunrise, a quiet sanctuary featuring direct-trade roasts, butter-flaky French pastries, and premium daytime executive boards. During sunset, we transform into an immersive high-contrast culinary experience with live music, artisanal cocktails, and prime-grade meat cuts.
            </p>
            <p className="italic text-amber-600 border-l border-amber-600 pl-4 py-1">
              &ldquo;No metrics are spared. From the temperature of our espresso groupheads to the aging of our premium ribeye beef cuts.&rdquo;
            </p>
          </div>

          {/* Quick specs section */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="border border-neutral-200 p-4 bg-neutral-50 shadow-sm">
              <span className="text-xs text-neutral-500 font-mono">Sunrise Coffee Sanctuary</span>
              <p className="text-xs text-neutral-900 font-mono mt-1">Daily 07:00 AM — 05:00 PM</p>
            </div>
            <div className="border border-neutral-200 p-4 bg-neutral-50 shadow-sm">
              <span className="text-xs text-neutral-500 font-mono">High Energy Fine Dining</span>
              <p className="text-xs text-neutral-900 font-mono mt-1">Daily 05:00 PM — 02:00 AM</p>
            </div>
          </div>

          {/* Premium Read More / Experience Button Link */}
          <div className="pt-2" id="read-more-experience-link">
            <button
              onClick={onReadMoreExperience}
              className="px-8 py-3.5 bg-black text-white hover:bg-neutral-900 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg text-xs font-mono tracking-widest uppercase mb-4"
              id="read-more-experience-btn"
            >
              <span>Explore The Complete Experience</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* REAL CUSTOMER AUDITS & REVIEWS */}
      <section id="reviews" className="bg-neutral-50 py-20 border-y border-neutral-200 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono uppercase block">
              Direct Audits from Lagos Elite
            </span>
            <h2 className="text-2xl md:text-4xl text-neutral-950 font-serif font-light">
              Guest Testimonials
            </h2>
          </div>

          {/* Large layout review card carousel switcher */}
          <div className="bg-white border border-neutral-200 p-8 md:p-12 relative text-left space-y-6 shadow-sm">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              ))}
            </div>

            <p className="text-sm md:text-lg text-neutral-800 leading-relaxed font-mono">
              &ldquo;{REVIEWS[activeReviewIndex].text}&rdquo;
            </p>

            <div className="flex justify-between items-end pt-4 border-t border-neutral-200">
              <div>
                <p className="text-xs text-neutral-900 uppercase font-mono font-semibold">
                  {REVIEWS[activeReviewIndex].name}
                </p>
                <p className="text-[10px] text-amber-600 font-mono mt-1">
                  {REVIEWS[activeReviewIndex].role} &bull; {REVIEWS[activeReviewIndex].date}
                </p>
              </div>

              {/* Share review button */}
              <button
                onClick={() => handleShareReview(REVIEWS[activeReviewIndex].text, activeReviewIndex)}
                className="p-2.5 bg-transparent hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5 border border-neutral-200 uppercase tracking-widest"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-700" />
                <span>{copiedIndex === activeReviewIndex ? "Copied Link!" : "Copy Audit"}</span>
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2">
            {REVIEWS.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setActiveReviewIndex(i)}
                className={`w-2 h-2 transition-all ${
                  activeReviewIndex === i ? "bg-black w-6" : "bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM LIVE FEED SIMULATION (Lagos vibes) */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left space-y-1">
            <span className="text-[10px] tracking-widest text-amber-600 font-mono uppercase block">
              @UpsideLagos Sanctuary
            </span>
            <h3 className="text-2xl md:text-3xl text-neutral-950 font-serif font-light">
              Instagram Moments
            </h3>
          </div>
          <button
            onClick={() => window.open("https://instagram.com", "_blank")}
            className="text-xs font-mono text-neutral-800 hover:text-black hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer border border-neutral-200 px-4 py-2 uppercase"
          >
            <Instagram className="w-4 h-4 text-amber-600" />
            <span>Follow Our Feed</span>
          </button>
        </div>

        {/* Instashow Grid of Moody Culinary Art */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tag: "Artisanal Brew", img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=650" },
            { tag: "Late Mixology", img: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=650" },
            { tag: "Fine Searing", img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=650" },
            { tag: "Ambient Lounge", img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=650" }
          ].map((inst, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden bg-black border border-neutral-900 cursor-pointer"
            >
              <img
                src={inst.img}
                alt={inst.tag}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale filter brightness-[1.65] contrast-[1.25] group-hover:brightness-[1.2]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left">
                <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest">
                  {inst.tag}
                </span>
                <span className="text-[9px] text-white font-mono mt-0.5 animate-fadeIn">
                  #UpsideLagos #LagosFineDining
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
