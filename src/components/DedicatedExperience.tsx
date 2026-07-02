import React from "react";
import { ArrowLeft, Compass, Award, Calendar, Music, Sparkles, Clock, MapPin, Coffee, Utensils } from "lucide-react";

interface DedicatedExperienceProps {
  onBackToLobby: () => void;
  onOpenReservations: () => void;
}

export default function DedicatedExperience({
  onBackToLobby,
  onOpenReservations
}: DedicatedExperienceProps) {
  return (
    <div className="bg-white min-h-screen pt-12 pb-24 px-4 md:px-8 animate-fadeIn text-left text-neutral-900" id="dedicated-experience-page">
      <div className="max-w-[1800px] mx-auto space-y-16">
        
        {/* Navigation Breadcrumb / Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <button
            onClick={onBackToLobby}
            className="group flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer self-start"
            id="experience-back-to-lobby-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>&larr; Return to Sanctuary Lobby</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>UPSIDE LOBBY</span>
            <span>/</span>
            <span className="text-amber-600">EXPERIENCE & VISION MANIFESTO</span>
          </div>
        </div>

        {/* Master Cover Hero with stunning imagery */}
        <div className="relative aspect-[16/9] w-full overflow-hidden border border-neutral-200" id="experience-hero-cover">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200"
            alt="Interior of Upside sanctuary"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent shadow-inner" />
          
          {/* Cover Info Overlay */}
          <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 space-y-4 max-w-2xl">
            <span className="px-3 py-1 bg-black text-white text-[9px] font-mono tracking-widest uppercase font-bold inline-block">
              Lekki's Dual Vibe Masterpiece
            </span>
            <h1 className="text-3xl md:text-5xl font-sans tracking-tight font-light text-neutral-900 leading-tight uppercase">
              The Sovereign Sanctuary of <br />
              <span className="font-serif italic text-amber-600 font-medium">Epicurean Artistry</span>
            </h1>
            <p className="text-xs md:text-sm text-neutral-700 font-mono tracking-wide leading-relaxed font-light hidden sm:block">
              In the heart of Lagos, we defined a dual identity sanctuary. Sunrise greets master slow bar roasts and daytime executive panels. Sunset reveals intense mixology, high energy dining beats, and flawlessly aged steak cuts.
            </p>
          </div>
        </div>

        {/* CORE DUALITY IDENTITY EXPLAINED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Day Identity */}
          <div className="bg-neutral-50 border border-neutral-200 p-8 space-y-6 hover:border-amber-500/40 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-600">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-600 uppercase">07:00 AM — 05:00 PM</span>
                <h3 className="text-xl font-sans text-neutral-900 uppercase font-bold mt-0.5">The Sunrise Coffee Sanctuary</h3>
              </div>
            </div>
            
            <p className="text-xs md:text-sm text-neutral-700 font-mono font-light leading-relaxed">
              Daytime at Upside is engineered for quiet contemplation, high-stakes executive briefing meetings, and meticulous coffee extraction. We partner with handpicked direct-trade micro-groweries globally. Every single origin batch is tested under exact gas-chromatography levels to maintain unparalleled citrus, caramel, or floral undertones.
            </p>

            <ul className="text-xs font-mono text-neutral-600 space-y-3 border-t border-neutral-200 pt-4">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>Dual boiler Synesso MVP Hydra espresso extraction</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>Artisan butter-flake brioches & French baked croissants</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>Optimized quiet workstations with executive power sockets</span>
              </li>
            </ul>

            <img
              src="https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=600"
              alt="Craft barista pouring"
              className="w-full h-48 object-cover border border-neutral-200"
            />
          </div>

          {/* Night Identity */}
          <div className="bg-neutral-50 border border-neutral-200 p-8 space-y-6 hover:border-amber-500/40 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-rose-600 uppercase">05:00 PM — 10:00 PM</span>
                <h3 className="text-xl font-sans text-neutral-900 uppercase font-bold mt-0.5">High Energy Fine Dining Sunset</h3>
              </div>
            </div>

            <p className="text-xs md:text-sm text-neutral-700 font-mono font-light leading-relaxed">
              As the daylight fades over the Atlantic coast, the ambiance thickens. The warm downlights dim to premium candle alignments and the signature flames ignite. Our master kitchen prepares hand-crafted premium dry-aged steak cuts, traditional upscale soup broths, and bespoke mixology cocktails, accompanied by ambient, soft music playing in the background.
            </p>

            <ul className="text-xs font-mono text-neutral-600 space-y-3 border-t border-neutral-200 pt-4">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <span>Premium U.S. Choice ribeye beef, dried under 28 days tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <span>Handcrafted bitters, home-grown elderflower syrups and ice stones</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <span>Curated acoustic and soul background music played at the perfect level</span>
              </li>
            </ul>

            <img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600"
              alt="Rich steak display on embers"
              className="w-full h-48 object-cover border border-neutral-200"
            />
          </div>

        </div>

        {/* DETAILED BEHIND-THE-SCENES CULINARY INTENT */}
        <div className="bg-neutral-50 border border-neutral-200 p-8 relative overflow-hidden shadow-sm" id="experience-culinary-intent">
          <div className="absolute -bottom-16 -left-16 text-neutral-200/40 pointer-events-none">
            <Award className="w-60 h-60" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Image */}
            <div className="lg:col-span-5 relative">
              <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"
                alt="Finest meats raw details"
                className="w-full object-cover aspect-square border border-neutral-200"
              />
              <div className="absolute -bottom-4 -right-4 bg-black text-white p-4 font-mono font-bold text-center border border-neutral-800 hidden sm:block">
                <p className="text-xs uppercase">AGED FOR</p>
                <p className="text-2xl font-black">28</p>
                <p className="text-[10px]">DAYS MAXIMUM</p>
              </div>
            </div>

            {/* Narrative specs */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-600 font-mono block">
                MEET CO-CHEF TUNDE OLUMIDE
              </span>
              <h2 className="text-2xl md:text-3xl font-sans font-light tracking-tight text-neutral-900 uppercase">
                &ldquo;No Shortcuts inside the Sanctuary Pantry&rdquo;
              </h2>
              
              <div className="space-y-4 text-xs md:text-sm text-neutral-700 font-mono font-light leading-relaxed">
                <p>
                  "We designed a kitchen where traditional Lagos flavors merge with rigorous classic French assembly. Our iconic <span className="text-amber-600 font-bold">Asun Dodo Deluxe</span> is caramel-seared over organic sweet peppers but cooked with deep, slow reduction. Our local <span className="text-amber-600 font-bold">Catfish Pepper Soup</span> broth requires six hours of low-temperature steam extraction to allow the native seeds to expand completely."
                </p>
                <p>
                  "Our steaks are sourced from local organic cattle ranches committed to premium feed regimens, trimmed surgically by hand, and cooked exclusively over hardwood embers and herb-infused butter. This is not fast food. This is severe dedication to Lagos' pinnacle standard."
                </p>
              </div>

              {/* Award bullet chips */}
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="px-3.5 py-1.5 border border-neutral-200 bg-white text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 text-neutral-700 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>2026 Lekki Gourmet Icon Award</span>
                </span>
                <span className="px-3.5 py-1.5 border border-neutral-200 bg-white text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 text-neutral-700 shadow-sm">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verified Single Origin Slow Bar Sourcing</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* THE CURATED SOUNDSCAPE & SENSORY BACKGROUND */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-mono block">
              THE AUDITORY BACKGROUND
            </span>
            <h2 className="text-2xl md:text-4xl text-neutral-950 font-serif font-light">
              The Curated Ambient Soundscape
            </h2>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-8 text-center space-y-6 max-w-3xl mx-auto shadow-sm">
            <div className="flex justify-center">
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-600">
                <Music className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-sans uppercase tracking-wider text-neutral-900">Sophisticated, Conversational, Undisturbed</h3>
              <p className="text-xs md:text-sm text-neutral-700 font-mono leading-relaxed max-w-xl mx-auto font-light">
                At Upside, we focus exclusively on our dedicated restaurant and café craftsmanship. There are no distracting loud events or crowded nightlife scheduling. Instead, a finely tailored acoustic soundscape plays continuously in the background. 
              </p>
              <p className="text-xs md:text-sm text-neutral-600 font-mono leading-relaxed max-w-xl mx-auto font-light">
                Our custom-integrated, high-fidelity sound system plays handpicked acoustic melodies, soulful lounge tunes, and warm jazz pieces at the absolute perfect decibel levels, ensuring your executive daytime panels and candlelit evening conversations remain flawlessly intimate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4 border-t border-neutral-200 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 block">&bull; Daylight Selection</span>
                <span className="text-[11px] font-mono text-neutral-600 block">Soft, organic acoustic guitar chords, light soul, and refreshing daytime jazz to keep your morning coffee meetings focused.</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 block">&bull; Evening Elegance</span>
                <span className="text-[11px] font-mono text-neutral-600 block">Deep, rich vocal soul, warm jazz, and soothing downtempo melodies that complement your prime grills perfectly.</span>
              </div>
            </div>
          </div>

          {/* Book table or Go back trigger */}
          <div className="pt-6 text-center space-x-4">
            <button
              onClick={onOpenReservations}
              className="px-8 py-4 bg-black text-white font-bold text-xs tracking-widest font-mono uppercase hover:bg-neutral-900 transition-colors cursor-pointer inline-block shadow-lg"
              id="experience-book-table-cta"
            >
              Book a Lounge Table &rarr;
            </button>
            <button
              onClick={onBackToLobby}
              className="px-8 py-4 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 font-bold text-xs tracking-widest font-mono uppercase transition-colors cursor-pointer inline-block shadow-sm"
              id="experience-back-to-home-cta"
            >
              Back to Home page
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
