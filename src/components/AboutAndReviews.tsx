import React, { useState } from "react";
import { REVIEWS } from "../data/menu";
import { Award, Compass, Heart, Share2, Star, Mail, MapPin, Instagram, Sparkles, Gift } from "lucide-react";

interface AboutAndReviewsProps {
  onReadMoreExperience: () => void;
}

export default function AboutAndReviews({ onReadMoreExperience }: AboutAndReviewsProps) {
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [joinedLoyalty, setJoinedLoyalty] = useState(false);
  const [loyaltyEmail, setLoyaltyEmail] = useState("");

  const handleShareReview = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleJoinLoyalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (loyaltyEmail.trim() === "") return;
    setJoinedLoyalty(true);
  };

  return (
    <div className="bg-black space-y-20 pt-10 pb-20">

      {/* THE ABOUT BRAND STORY & HERITAGE */}
      <section id="experience" className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Rich visual story grid (Bento Grid Style) */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden border border-neutral-900 bg-neutral-950">
              <img
                src="https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=600"
                alt="Finest latte art pouring"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="bg-neutral-950 border border-amber-900/20 p-6 space-y-2">
              <Award className="w-6 h-6 text-amber-500" />
              <h4 className="text-xs font-mono font-bold tracking-wider text-white uppercase">Premium Ingredients</h4>
              <p className="text-[10px] text-neutral-400 font-mono">
                From organic coffee crops to prime steaks shipped weekly.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-10">
            <div className="bg-neutral-950 border border-amber-900/20 p-6 space-y-2">
              <Compass className="w-6 h-6 text-amber-500" />
              <h4 className="text-xs font-mono font-bold tracking-wider text-white uppercase">Lagos Vibe Sanctuary</h4>
              <p className="text-[10px] text-neutral-400 font-mono">
                Pioneering fine nightlife dining fused with elite daytime workspace.
              </p>
            </div>
            <div className="aspect-[3/4] overflow-hidden border border-neutral-900 bg-neutral-950">
              <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"
                alt="Elite flame-grilled steaks"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Copy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className="text-xs font-mono tracking-[0.3em] text-amber-500 uppercase block">
            The Signature Vibe
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-light tracking-tight text-white leading-tight">
            Elevating Contemporary <br />
            <span className="font-serif italic text-amber-400">African Hospitality</span>
          </h2>
          
          <div className="space-y-4 text-xs md:text-sm text-neutral-300 font-mono tracking-wide leading-relaxed font-light">
            <p>
              Born from a pursuit to bridge premium artisan coffee culture with world-class nocturnal fine dining, <span className="text-white font-semibold">Upside Restaurant & Café</span> has quickly defined the skyline of Lekki’s gourmet arena.
            </p>
            <p>
              We pride ourselves on the meticulous curation of dual identity: during sunrise, a quiet sanctuary featuring direct-trade roasts, butter-flaky French pastries, and premium daytime executive boards. During sunset, we transform into an immersive high-contrast culinary experience with live music, artisanal cocktails, and prime-grade meat cuts.
            </p>
            <p className="italic text-amber-500 border-l border-amber-500 pl-4 py-1">
              &ldquo;No metrics are spared. From the temperature of our espresso groupheads to the aging of our premium ribeye beef cuts.&rdquo;
            </p>
          </div>

          {/* Quick specs section */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="border border-neutral-900 p-4 bg-neutral-950">
              <span className="text-xs text-neutral-400 font-mono">Sunrise Coffee Sanctuary</span>
              <p className="text-xs text-white font-mono mt-1">Daily 07:00 AM — 05:00 PM</p>
            </div>
            <div className="border border-neutral-900 p-4 bg-neutral-950">
              <span className="text-xs text-neutral-400 font-mono">High Energy Fine Dining</span>
              <p className="text-xs text-white font-mono mt-1">Daily 05:00 PM — 02:00 AM</p>
            </div>
          </div>

          {/* Premium Read More / Experience Button Link */}
          <div className="pt-2" id="read-more-experience-link">
            <button
              onClick={onReadMoreExperience}
              className="px-8 py-3.5 bg-amber-500 text-black font-semibold text-xs font-mono tracking-widest uppercase hover:bg-amber-450 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg hover:shadow-amber-500/10"
              id="read-more-experience-btn"
            >
              <span>Explore The Complete Experience</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* REAL CUSTOMER AUDITS & REVIEWS */}
      <section id="reviews" className="bg-neutral-950 py-20 border-y border-neutral-900/80 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.3em] text-amber-500 font-mono uppercase block">
              Direct Audits from Lagos Elite
            </span>
            <h2 className="text-2xl md:text-4xl text-white font-serif font-light">
              Guest Testimonials
            </h2>
          </div>

          {/* Large layout review card carousel switcher */}
          <div className="bg-black border border-amber-900/10 p-8 md:p-12 relative text-left space-y-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              ))}
            </div>

            <p className="text-sm md:text-lg text-neutral-200 leading-relaxed font-mono">
              &ldquo;{REVIEWS[activeReviewIndex].text}&rdquo;
            </p>

            <div className="flex justify-between items-end pt-4 border-t border-neutral-900">
              <div>
                <p className="text-xs text-white uppercase font-mono font-semibold">
                  {REVIEWS[activeReviewIndex].name}
                </p>
                <p className="text-[10px] text-amber-500 font-mono mt-1">
                  {REVIEWS[activeReviewIndex].role} &bull; {REVIEWS[activeReviewIndex].date}
                </p>
              </div>

              {/* Share review button */}
              <button
                onClick={() => handleShareReview(REVIEWS[activeReviewIndex].text, activeReviewIndex)}
                className="p-2.5 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5 border border-neutral-900 uppercase tracking-widest"
              >
                <Share2 className="w-3.5 h-3.5" />
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
                  activeReviewIndex === i ? "bg-amber-500 w-6" : "bg-neutral-800"
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
            <span className="text-[10px] tracking-widest text-amber-500 font-mono uppercase block">
              @UpsideLagos Sanctuary
            </span>
            <h3 className="text-2xl md:text-3xl text-white font-serif font-light">
              Instagram Moments
            </h3>
          </div>
          <button
            onClick={() => window.open("https://instagram.com", "_blank")}
            className="text-xs font-mono text-amber-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer border border-neutral-900 px-4 py-2 uppercase"
          >
            <Instagram className="w-4 h-4 text-amber-500" />
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
              className="group relative aspect-square overflow-hidden bg-neutral-900 border border-neutral-900 cursor-pointer"
            >
              <img
                src={inst.img}
                alt={inst.tag}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left">
                <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest">
                  {inst.tag}
                </span>
                <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
                  #UpsideLagos #LagosFineDining
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOYALTY CLUB & NEWSLETTER SECTION */}
      <section id="loyalty" className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-neutral-950 to-amber-950/20 border border-amber-900/30 p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-8">
          {/* Subtle absolute designs */}
          <div className="absolute -top-12 -right-12 text-amber-950/10 stroke-1 select-none pointer-events-none">
            <Gift className="w-48 h-48" />
          </div>

          {/* Left Text details */}
          <div className="space-y-4 max-w-lg text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-400 font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upside Centurion Club</span>
            </div>

            <h3 className="text-xl md:text-3xl text-white font-serif font-light">
              Join the Vanguard Loyalty Club
            </h3>

            <p className="text-xs text-neutral-300 font-mono leading-relaxed">
              Unlock exceptional privileges: priority lounge seating during acoustic nights, private chef tasting invitations, and 10% cash back on digital food orders.
            </p>
          </div>

          {/* Right Newsletter loyalty Form */}
          <div className="w-full lg:w-96 relative z-10">
            {!joinedLoyalty ? (
              <form onSubmit={handleJoinLoyalty} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter Private Email..."
                    value={loyaltyEmail}
                    onChange={(e) => setLoyaltyEmail(e.target.value)}
                    className="flex-grow bg-black border border-neutral-800 text-white font-mono text-xs py-3.5 px-4 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-amber-500 text-black font-semibold text-xs font-mono uppercase tracking-widest hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Join Club
                  </button>
                </div>
                <p className="text-[9px] font-mono text-neutral-500 leading-normal text-left sm:text-center block">
                  Free membership. Instant premium voucher sent code to inbox upon dispatch.
                </p>
              </form>
            ) : (
              <div className="bg-black/95 border border-amber-500/40 p-6 space-y-3 text-center">
                <p className="text-xl text-amber-400 font-serif italic">Welcome to the Club.</p>
                <p className="text-xs text-neutral-300 font-mono">
                  Membership verified: <span className="text-white underline">{loyaltyEmail}</span>. Exclusive 15% discount code <span className="font-semibold text-white">UPSIDELUXE</span> is locked for your checkout!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
