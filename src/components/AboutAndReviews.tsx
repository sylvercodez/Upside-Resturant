import React, { useState, useEffect } from "react";
import { REVIEWS } from "../data/reviews";
import { Award, Compass, Heart, Share2, Star, Mail, MapPin, Instagram, Sparkles, Gift, Play, Pause, Volume2, VolumeX, MessageCircle, Zap, QrCode, Smartphone, ArrowRight, RefreshCw, Check } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";

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
  const [reviewsList, setReviewsList] = useState<any[]>(REVIEWS);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [instagramFeed, setInstagramFeed] = useState<InstagramPost[]>([]);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchGoogleReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      const fbReviews: any[] = [];
      snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        // Filter: only show reviews with a rating greater than 3.5
        if (data.rating === undefined || data.rating === null || data.rating > 3.5) {
          fbReviews.push({ id: snapshotDoc.id, ...data });
        }
      });

      if (fbReviews.length > 0) {
        setReviewsList(fbReviews.slice(0, 5));
      } else {
        const googleReviewsRef = collection(db, "google_reviews");
        const q2 = query(googleReviewsRef, orderBy("createdAt", "desc"), limit(20)); // Fetch more to filter down
        const snapshot2 = await getDocs(q2);
        const fbGReviews: any[] = [];
        snapshot2.forEach((snapshotDoc) => {
          const data = snapshotDoc.data();
          // Filter: only show reviews with a rating greater than 3.5
          if (data.rating === undefined || data.rating === null || data.rating > 3.5) {
            fbGReviews.push({ id: snapshotDoc.id, ...data });
          }
        });
        if (fbGReviews.length > 0) {
          setReviewsList(fbGReviews.slice(0, 5));
        }
      }
    } catch (err) {
      console.warn("Could not fetch reviews from Firestore, using fallbacks:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchGoogleReviews();
  }, []);

  const handleSyncReviews = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      setSyncMessage("Crawling fresh Google Reviews...");
      const response = await fetch(getApiUrl("/api/reviews/crawl"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("Failed to trigger reviews sync on server.");
      }
      const data = await response.json();
      setSyncMessage(`Successfully crawled and updated ${data.reviews?.length || 0} reviews!`);
      await fetchGoogleReviews();
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error: any) {
      console.error("Error syncing Google reviews:", error);
      setSyncMessage("Sync failed. Using available reviews.");
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

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
            permalink: data.permalink || "https://www.instagram.com/upsidebymopheth/",
            media_type: data.media_type || "IMAGE",
            timestamp: data.timestamp || ""
          });
        });
        if (posts.length > 0) {
          setInstagramFeed(posts);
          setIsLiveFeed(true);
        }

        // Trigger check-sync to keep the database fresh (checks if > 3 days since last sync)
        const checkSyncRes = await fetch("/api/instagram/check-sync");
        if (checkSyncRes.ok) {
          const checkSyncData = await checkSyncRes.json();
          if (checkSyncData.shouldCrawl) {
            console.log("[Instagram Crawler] Feed is stale or unseeded, triggering automatic background crawl...");
            const crawlRes = await fetch("/api/instagram/crawl", { method: "POST" });
            if (crawlRes.ok) {
              const crawlData = await crawlRes.json();
              if (crawlData.posts && crawlData.posts.length > 0) {
                console.log("[Instagram Crawler] Background crawl successful! Updating live feed.");
                const updatedPosts = crawlData.posts.map((item: any) => ({
                  id: item.id,
                  caption: item.caption || "Upside Gourmet Moment",
                  media_url: item.media_url,
                  permalink: item.permalink || "https://www.instagram.com/upsidebymopheth/",
                  media_type: item.media_type || "IMAGE",
                  timestamp: item.timestamp || ""
                }));
                setInstagramFeed(updatedPosts.slice(0, 8));
                setIsLiveFeed(true);
              }
            }
          }
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
      <section id="experience" className="max-w-[1800px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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
              <p className="text-xs text-neutral-900 font-mono mt-1">Daily 05:00 PM — 10:00 PM</p>
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
      <section id="cinematic-showcase-section" className="max-w-[1800px] mx-auto px-4 md:px-8">
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
      <section id="whatsapp-ordering-section" className="max-w-[1800px] mx-auto px-4 md:px-8">
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

      {/* REAL CUSTOMER AUDITS & REVIEWS */}
      <section id="reviews" className="bg-neutral-50 py-20 border-y border-neutral-200 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono uppercase block">
              Direct Google Reviews & Audits
            </span>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-500">
              <span className="inline-flex gap-0.5 font-sans text-xs font-bold mr-1">
                <span className="text-blue-600">G</span>
                <span className="text-red-600">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-600">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-600">e</span>
              </span>
              <span>Review Rating &bull; 4.9 / 5.0 Stars</span>
            </div>
            <h2 className="text-2xl md:text-4xl text-neutral-950 font-serif font-light">
              Lagos Guest Testimonials
            </h2>
          </div>

          {/* Large layout review card carousel switcher */}
          {reviewsList.length > 0 && (
            <div className="bg-white border border-neutral-200 p-8 md:p-12 relative text-left space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-[9px] font-mono uppercase bg-neutral-100 px-2 py-0.5 text-neutral-600 ml-2 tracking-widest font-bold">Recommended</span>
                </div>
                
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white font-sans text-[9px] font-bold">G</span>
                  <span>Verified Google Review</span>
                </span>
              </div>

              <p className="text-sm md:text-lg text-neutral-800 leading-relaxed font-mono">
                &ldquo;{reviewsList[activeReviewIndex % reviewsList.length]?.text}&rdquo;
              </p>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-900 uppercase font-mono font-semibold">
                    {reviewsList[activeReviewIndex % reviewsList.length]?.name}
                  </p>
                  <p className="text-[10px] text-amber-600 font-mono mt-1">
                    {reviewsList[activeReviewIndex % reviewsList.length]?.role} &bull; {reviewsList[activeReviewIndex % reviewsList.length]?.date}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* View More Reviews Link on Google Search page */}
                  <button
                    onClick={() => {
                      window.open("https://www.google.com/search?q=upside+restaurant+and+cafe+review&oq=upside+restaurant+and+cafe+review&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigAdIBCTEwMTIzajBqN6gCALACAA&sourceid=chrome&ie=UTF-8#lrd=0x103bf53bc1bafc11:0x862e561d3c1caad2,1,,,,", "_blank");
                    }}
                    className="p-2 sm:p-2.5 bg-neutral-950 hover:bg-neutral-900 text-white transition-all cursor-pointer text-[10px] sm:text-xs font-mono flex items-center justify-center gap-1.5 border border-transparent uppercase tracking-widest whitespace-nowrap w-full sm:w-auto hover:text-amber-500 active:scale-95"
                  >
                    <span className="inline-flex gap-0.5 font-sans font-bold text-[9px] mr-1.5">
                      <span className="text-blue-400">G</span>
                      <span className="text-red-400">o</span>
                      <span className="text-yellow-400">o</span>
                      <span className="text-blue-400">g</span>
                      <span className="text-green-400">l</span>
                      <span className="text-red-400">e</span>
                    </span>
                    <span>View More Reviews</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2">
            {reviewsList.map((r, i) => (
              <button
                key={r.id || i}
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
      <section className="max-w-[1800px] mx-auto px-4 md:px-8 space-y-6">
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
            onClick={() => window.open("https://www.instagram.com/upsidebymopheth/", "_blank")}
            className="text-xs font-mono text-neutral-800 hover:text-black hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer border border-neutral-200 px-4 py-2 uppercase"
          >
            <Instagram className="w-4 h-4 text-amber-600" />
            <span>Follow Our Feed</span>
          </button>
        </div>

        {/* Instashow Grid of Dynamic Culinary Art */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(instagramFeed.length > 0 ? instagramFeed : [
            { id: "p1", caption: "Artisanal Brew", media_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=650", permalink: "https://www.instagram.com/upsidebymopheth/" },
            { id: "p2", caption: "Late Mixology", media_url: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=650", permalink: "https://www.instagram.com/upsidebymopheth/" },
            { id: "p3", caption: "Fine Searing", media_url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=650", permalink: "https://www.instagram.com/upsidebymopheth/" },
            { id: "p4", caption: "Ambient Lounge", media_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=650", permalink: "https://www.instagram.com/upsidebymopheth/" }
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
