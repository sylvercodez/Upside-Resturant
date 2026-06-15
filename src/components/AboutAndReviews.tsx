import React, { useState, useEffect } from "react";
import { REVIEWS } from "../data/menu";
import { Award, Compass, Heart, Share2, Star, Mail, MapPin, Instagram, Sparkles, Gift, Play, Pause, Volume2, VolumeX, MessageCircle, Zap, QrCode, Smartphone, ArrowRight } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  permalink?: string;
  media_type?: string;
  timestamp?: string;
}

interface AboutAndReviewsProps {
  onReadMoreExperience: () => void;
  onViewMenu?: () => void;
}

export default function AboutAndReviews({ onReadMoreExperience, onViewMenu }: AboutAndReviewsProps) {
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [instagramFeed, setInstagramFeed] = useState<InstagramPost[]>([]);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.warn("Video play exception:", e));
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    async function fetchInstagramFeed() {
      try {
        const postsRef = collection(db, "instagram_posts");
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(8));
        const querySnapshot = await getDocs(q);
        const posts: InstagramPost[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            caption: data.caption || "",
            media_url: data.media_url,
            permalink: data.permalink || "https://instagram.com",
            media_type: data.media_type || "IMAGE",
            timestamp: data.timestamp || ""
          });
        });
        if (posts.length > 0) {
          setInstagramFeed(posts);
          setIsLiveFeed(true);
        }
      } catch (err) {
        console.warn("Instagram dynamic feed offline or unseeded, using premium standard fallbacks:", err);
      }
    }
    fetchInstagramFeed();
  }, []);

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
            <div className="aspect-[3/4] overflow-hidden border border-neutral-950 bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=600"
                alt="Finest latte art pouring"
                className="w-full h-full object-cover transition-all duration-700"
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
            <div className="aspect-[3/4] overflow-hidden border border-neutral-950 bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"
                alt="Elite flame-grilled steaks"
                className="w-full h-full object-cover transition-all duration-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Copy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className="text-xs font-mono tracking-[0.3em] text-amber-600 uppercase block">
            Best Restaurant in Lagos - The Signature Vibe
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-light tracking-tight text-neutral-950 leading-tight">
            Elevating Fine Dining &amp; <br />
            <span className="font-serif italic text-amber-600">Lagos Contemporary Gastronomy</span>
          </h2>
          
          <div className="space-y-4 text-xs md:text-sm text-neutral-700 font-mono tracking-wide leading-relaxed font-light font-sans text-justify">
            <p>
              Ranked among the <strong className="text-amber-800">best restaurants in Lagos</strong>, <span className="text-neutral-900 font-semibold font-sans">Upside Restaurant &amp; Café</span> is a masterpiece bridging premium artisan coffee roastery with world-class nocturnal fine dining. Strategically situated for guests in Lekki Phase 1, Victoria Island, and Ikoyi, Upside has defined itself as the premier culinary sanctuary for luxury dining in Nigeria.
            </p>
            <p>
              We pride ourselves on being a top-tier <strong className="text-neutral-900">fine dining destination in Lekki, Lagos</strong>, meticulous in our dual-concept curation. By day, enjoy a serene coffee shop containing direct-trade roasts, gourmet breakfast pancakes, and workspace environments. By night, we evolve into a high-energy luxury steakhouse featuring prime steaks, live music, and bespoke Lagos mixology.
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
              className="px-4 sm:px-8 py-3.5 bg-black text-white hover:bg-neutral-900 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-lg text-[10px] sm:text-xs font-mono tracking-widest uppercase mb-4 whitespace-nowrap"
              id="read-more-experience-btn"
            >
              <span>Explore Complete Experience</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* CINEMATIC EXPERIENTIAL VIDEO SHOWCASE */}
      <section id="cinematic-showcase-section" className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative border border-neutral-200 bg-neutral-50 p-6 md:p-10 space-y-8 shadow-sm">
          <div className="text-left space-y-2">
            <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono uppercase block">
              Cinematic Atmosphere
            </span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="text-2xl md:text-4xl text-neutral-950 font-serif font-light leading-tight">
                Experience Upside in Motion
              </h2>
              <p className="text-neutral-600 font-mono text-xs max-w-md">
                A glimpse into our luxurious dining space, high-energy gourmet culinary lounge, and elite artisan brews.
              </p>
            </div>
          </div>

          {/* Interactive Player Frame */}
          <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden border border-neutral-950 bg-black group" id="cinematic-video-frame">
            <video
              id="upside-promo-video-player"
              src="https://res.cloudinary.com/dgc6ootad/video/upload/v1781165611/upsidevideo_ywljfb.mp4"
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              autoPlay
              playsInline
              ref={videoRef}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Gradient Mask Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  id="video-toggle-play-btn"
                  onClick={togglePlay}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-amber-500 hover:text-black text-white border border-white/20 hover:border-transparent flex items-center justify-center transition-all duration-300 cursor-pointer"
                  title={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current translate-x-0.5" />}
                </button>

                <button
                  id="video-toggle-mute-btn"
                  onClick={toggleMute}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-neutral-800 text-white border border-white/20 flex items-center justify-center transition-all duration-300 cursor-pointer"
                  title={isMuted ? "Unmute Video" : "Mute Video"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>

              {/* Status HUD indicator */}
              <div className="text-[9px] md:text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-black/60 px-3 py-1.5 border border-amber-500/20 rounded-none animate-pulse">
                <span>✦ Cinematic Playback Live</span>
              </div>
            </div>

            {/* Visual aesthetic logo watermark */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 opacity-75 sm:opacity-90">
              <span className="font-sans font-bold text-[9px] tracking-[0.2em] text-white bg-black/50 px-3 py-1 border border-neutral-800">
                UPSIDE FINE DINING
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BOLD, UNMISSABLE WHATSAPP ORDERING SECTION */}
      <section id="whatsapp-ordering-section" className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden border border-emerald-900/40 bg-neutral-950 p-8 md:p-12 text-white">
          {/* Subtle noise/grid ambient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Main call to action text column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Priority Order Channel Active</span>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl md:text-5xl font-sans font-extrabold tracking-tight text-white leading-tight">
                  We Also Accept <br />
                  <span className="text-emerald-400">Orders via WhatsApp</span>
                </h2>
                <p className="text-neutral-400 font-mono text-xs md:text-sm leading-relaxed max-w-xl">
                  Skip the website forms entirely. Place your gourmet delivery or instant self-pickup orders directly with our elite Lagos restaurant concierge for priority immediate tracking and lightning-fast kitchen handoff.
                </p>
              </div>

              {/* Quality service badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase">Skip The Digital Queue</h4>
                    <p className="text-[10px] text-neutral-400 font-mono">Bypasses typical checkout routes for ultra-prompt priority preparation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MessageCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase">Real Human Concierges</h4>
                    <p className="text-[10px] text-neutral-400 font-mono">Chat directly with a real hospitality assistant for personalized service.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium CTA box column */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 p-6 md:p-8 space-y-6 text-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black font-mono font-bold text-[8px] uppercase tracking-[0.25em] px-3.5 py-1">
                Lagos Express Food Line
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] tracking-widest text-neutral-500 font-mono uppercase block">
                  Quick Link &bull; Live Support
                </span>
                <p className="text-2xl font-mono font-bold text-white tracking-tight">
                  0911 - 464 - 6767
                </p>
                <p className="text-[10px] text-neutral-400 font-mono leading-relaxed px-4">
                  Operating daily alongside our premium Sunrise Coffee & Fine Nightlife Grill.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const waText = encodeURIComponent("Hello Upside! I would like to place a premium order.");
                    window.open(`https://wa.me/2349114646767?text=${waText}`, "_blank");
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-[0.99] whitespace-nowrap"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-current text-white shrink-0" />
                  <span>Start WhatsApp Order</span>
                </button>

                <p className="text-[9px] text-neutral-500 font-mono leading-relaxed">
                  Clicking opens WhatsApp secure chat. Standard checkout values, custom catering menu, and premium steaks are fully supported here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTANT PHONE ORDERING QR CODE SECTION */}
      <section id="qr-ordering-section" className="max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-4">
        <div className="relative border border-neutral-200 bg-neutral-50 p-6 md:p-10 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Text details column */}
            <div className="md:col-span-7 space-y-6 text-left">
              <div className="space-y-2">
                <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono uppercase block">
                  Scan & Taste
                </span>
                <h2 className="text-2xl md:text-3xl text-neutral-950 font-serif font-light leading-tight">
                  Browse Menu & Order <br />Directly on Your Phone
                </h2>
                <p className="text-neutral-600 font-mono text-xs max-w-lg mt-3 leading-relaxed">
                  Join our distinguished guests using our integrated smartphone experiences. Scanning our physical or digital QR codes loads our full, authentic Lagos culinary offerings with express secure checkout instantly on your mobile browser.
                </p>
              </div>

              {/* Instructions steps */}
              <div className="space-y-4 pt-1">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</div>
                  <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                    Open your smartphone's built-in camera or QR scanner.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</div>
                  <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                    Point the lens at the QR code shown to lock and sync.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</div>
                  <p className="text-[11px] text-neutral-700 font-mono leading-relaxed">
                    Tap the recognized link to customize, add selections to your basket, and trigger local secure fulfillment.
                  </p>
                </div>
              </div>

              {/* Optional click-through call to action button */}
              {onViewMenu && (
                <div className="pt-2">
                  <button
                    onClick={onViewMenu}
                    className="group px-4 py-3 bg-neutral-950 hover:bg-amber-600 hover:text-black text-white font-mono text-[9px] sm:text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer shadow whitespace-nowrap"
                  >
                    <span>View Digital Menu Online</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                </div>
              )}
            </div>

            {/* QR Code Presentation Box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-white border border-neutral-200 p-6 md:p-8 space-y-4 shadow-sm relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 bg-neutral-950 text-white border border-neutral-800 font-mono text-[8px] uppercase tracking-widest px-3 py-1">
                Live Store Sync
              </div>

              {/* QR Frame Container */}
              <div className="relative p-3 bg-neutral-50 border-2 border-dashed border-neutral-200 group hover:border-amber-500/55 transition-colors">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://upside-restaurant-cafe.com/menu&color=000000"
                  alt="Upside Menu Direct Scan QR Code"
                  className="w-40 h-40 md:w-48 bg-white border border-neutral-200"
                  referrerPolicy="no-referrer"
                />
                
                {/* Micro tech corners around the picture */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-600" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-600" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-600" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-600" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] font-sans font-bold text-neutral-900 tracking-wider uppercase flex items-center justify-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Scan to order on mobile</span>
                </p>
                <p className="text-[8.5px] text-neutral-500 font-mono uppercase tracking-widest">
                  Secure Connection &bull; Upside Hospitality
                </p>
              </div>
            </div>
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

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-neutral-200">
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
                className="p-2 sm:p-2.5 bg-transparent hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer text-[10px] sm:text-xs font-mono flex items-center justify-center gap-1.5 border border-neutral-200 uppercase tracking-widest whitespace-nowrap w-full sm:w-auto"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest text-amber-600 font-mono uppercase block">
                @UpsideLagos Sanctuary
              </span>
              {isLiveFeed && (
                <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase text-emerald-500 bg-emerald-950/10 px-1.5 py-0.5 border border-emerald-900/30 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Live Feed Synchronized
                </span>
              )}
            </div>
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

        {/* Instashow Grid of Dynamic Culinary Art */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(instagramFeed.length > 0 ? instagramFeed : [
            { id: "p1", caption: "Artisanal Brew", media_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=650", permalink: "https://instagram.com" },
            { id: "p2", caption: "Late Mixology", media_url: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=650", permalink: "https://instagram.com" },
            { id: "p3", caption: "Fine Searing", media_url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=650", permalink: "https://instagram.com" },
            { id: "p4", caption: "Ambient Lounge", media_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=650", permalink: "https://instagram.com" }
          ]).map((inst) => (
            <div
              key={inst.id}
              onClick={() => inst.permalink && window.open(inst.permalink, "_blank")}
              className="group relative aspect-square overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer"
            >
              <img
                src={inst.media_url}
                alt={inst.caption || "Instagram Post"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left">
                <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest line-clamp-2">
                  {inst.caption || "Dining Moments"}
                </span>
                <span className="text-[8px] text-neutral-300 font-mono mt-1 block">
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
