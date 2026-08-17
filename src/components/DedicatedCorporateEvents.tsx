import React, { useState } from "react";
import { 
  ArrowLeft, 
  Briefcase, 
  Cake, 
  Users, 
  Sparkles, 
  Monitor, 
  Wifi, 
  Coffee, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  Award,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  FileText
} from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

interface DedicatedCorporateEventsProps {
  onBackToLobby: () => void;
  onOpenReservations?: () => void;
}

export default function DedicatedCorporateEvents({
  onBackToLobby,
}: DedicatedCorporateEventsProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    workEmail: "",
    phone: "",
    eventType: "boardroom_meeting",
    guestCount: "15",
    preferredDate: "",
    timeSlot: "morning",
    screenRequired: true,
    layoutStyle: "boardroom",
    specialNotes: "",
    budgetRange: "standard"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eventTypesList = [
    {
      id: "boardroom_meeting",
      title: "Executive Boardroom & Meeting",
      subtitle: "High-focus corporate meetings, quarterly reviews, and leadership sessions",
      icon: Briefcase,
      capacity: "8 – 24 Guests",
      timing: "Morning / Afternoon",
      popularFor: "Strategy reviews, pitch sessions, investor lunches"
    },
    {
      id: "corporate_birthday",
      title: "Corporate Birthday & Milestone Celebration",
      subtitle: "Executive birthdays, retirement milestones, and team achievements",
      icon: Cake,
      capacity: "12 – 60 Guests",
      timing: "Lunch / Evening",
      popularFor: "Department milestones, VIP birthdays, promotion dinners"
    },
    {
      id: "team_offsite",
      title: "Team Strategy Offsite & Retreat",
      subtitle: "Full or half-day immersive workshops and creative team sessions",
      icon: Users,
      capacity: "15 – 45 Guests",
      timing: "Half Day / Full Day",
      popularFor: "Design sprints, annual planning, team bonding"
    },
    {
      id: "product_launch_mixer",
      title: "Product Launch & Corporate Mixer",
      subtitle: "VIP networking, media reveals, client appreciation cocktail evenings",
      icon: Sparkles,
      capacity: "30 – 100 Guests",
      timing: "Evening Reception",
      popularFor: "Brand reveals, client gratitude mixers, tech demos"
    },
    {
      id: "executive_dinner",
      title: "VIP Executive Dinner & Client Hosting",
      subtitle: "Discreet fine dining, sommelier pairings, and premium steaks",
      icon: Award,
      capacity: "10 – 35 Guests",
      timing: "Dinner (6 PM – 10 PM)",
      popularFor: "C-suite client entertaining, contract celebrations"
    },
    {
      id: "full_buyout",
      title: "Exclusive Full Venue Buyout",
      subtitle: "Total takeover of Upside's dining hall, mezzanine, and lounge",
      icon: Layers,
      capacity: "Up to 120 Guests",
      timing: "Custom Schedule",
      popularFor: "End-of-year corporate galas, flagship brand events"
    }
  ];

  const spacesList = [
    {
      name: "The Mezzanine Executive Suite",
      badge: "Private & Acoustically Balanced",
      capacity: "Up to 24 Guests",
      desc: "An elevated private enclave overlooking the architectural dining room, outfitted with 4K display casting, high-speed fiber connectivity, and dedicated white-glove floor service.",
      amenities: ["4K Presentation Screen", "Dedicated Service Team", "Custom Seating Formats", "Ultra-fast Fiber Wi-Fi"],
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "The Main Dining Hall & Grand Sanctuary",
      badge: "High Ceilings & Warm Luxury",
      capacity: "40 – 80 Guests",
      desc: "Our centerpiece architectural space with natural daylight, ambient mood lighting, and flexible modular table layouts suited for corporate luncheons and presentation banquets.",
      amenities: ["Surround Acoustic Audio", "Presentation Stage Ready", "Modular Banquet Setup", "Artisanal Coffee Bar Access"],
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "The Alfresco Terrace & Cocktail Lounge",
      badge: "Open-Air Elegance",
      capacity: "20 – 45 Guests",
      desc: "Chic open-air terrace offering Lekki breezes, ambient deep house rhythms, and a dedicated bar station for corporate happy hours and mixer receptions.",
      amenities: ["Dedicated Mixologist Station", "Lounge Sofas & High Tops", "Ambient Overhead Lighting", "Covered Canopy"],
      image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const refNumber = "CORP-" + Math.floor(100000 + Math.random() * 900000);
    const inquiryPayload = {
      ...formData,
      refNumber,
      createdAt: new Date().toISOString(),
      status: "pending_review",
      source: "web_corporate_portal"
    };

    try {
      if (db) {
        await addDoc(collection(db, "corporate_inquiries"), inquiryPayload);
      }
    } catch (err: any) {
      console.warn("Firestore inquiry push notice (local fallback active):", err);
    }

    try {
      const stored = localStorage.getItem("upside_corporate_inquiries");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(inquiryPayload);
      localStorage.setItem("upside_corporate_inquiries", JSON.stringify(list));
    } catch (_) {}

    setIsSubmitting(false);
    setSubmittedRef(refNumber);
  };

  const getWhatsAppLink = () => {
    const selectedTypeObj = eventTypesList.find(t => t.id === formData.eventType);
    const text = `Hello Upside Events Team, I'd like to inquire about hosting a Corporate Event at Upside Lekki.\n\n*Reference:* ${submittedRef || "New Inquiry"}\n*Company:* ${formData.companyName || "N/A"}\n*Contact:* ${formData.contactName || "N/A"}\n*Event Type:* ${selectedTypeObj?.title || formData.eventType}\n*Guests:* ${formData.guestCount}\n*Preferred Date:* ${formData.preferredDate || "TBD"}\n*Time:* ${formData.timeSlot}\n*Layout:* ${formData.layoutStyle}\n*Notes:* ${formData.specialNotes || "None"}\n\nLooking forward to your proposal!`;
    return `https://wa.me/2349114646767?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-white min-h-screen pt-8 pb-28 px-4 md:px-8 animate-fadeIn text-left text-neutral-900" id="dedicated-corporate-events-page">
      <div className="max-w-[1700px] mx-auto space-y-16">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <button
            onClick={onBackToLobby}
            className="group flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer self-start"
            id="corporate-back-to-lobby-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>&larr; Return to Sanctuary Lobby</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>UPSIDE LEKKI</span>
            <span>/</span>
            <span className="text-amber-600 font-bold uppercase">Corporate &amp; Private Events</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative border border-neutral-200 bg-neutral-950 text-white overflow-hidden" id="corporate-hero-banner">
          <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1400"
              alt="Upside Corporate Event Sanctuary"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
          
          <div className="relative z-10 p-8 md:p-16 lg:p-20 max-w-5xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono tracking-widest uppercase font-bold">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>In-Venue Private Events &amp; Executive Dining</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-sans tracking-tight uppercase font-light leading-[1.08] text-white">
              Curated Spaces for <br />
              <span className="font-sans font-black tracking-tight text-amber-400 uppercase block mt-1.5 text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl drop-shadow-md">
                Business, Milestones &amp; Teams
              </span>
            </h1>

            <p className="text-neutral-200 font-mono text-sm md:text-base leading-relaxed max-w-3xl font-light">
              From executive boardroom meetings and strategy workshops to corporate birthdays and VIP client dinners, Upside Restaurant &amp; Café delivers high-performance hospitality, pristine presentation audio-visuals, and bespoke culinary dining inside Lekki, Lagos.
            </p>

            {/* Scope Clarification Alert Pill */}
            <div className="flex items-start gap-3 bg-neutral-900/90 border border-neutral-800 p-4 max-w-2xl text-[11px] font-mono text-neutral-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold uppercase tracking-wider block">In-Venue Event Hosting Exclusively</span>
                <span>All events are hosted and executed exclusively inside our Lekki venue. We specialize in corporate gatherings, executive sessions, and celebration buyouts. We do not provide external catering services or wedding receptions.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href="#corporate-inquiry-section"
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Request Event Proposal</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/2349114646767?text=Hello%20Upside%20Team%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20corporate%20event%20at%20Upside%20Lekki."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-transparent border border-neutral-700 hover:border-white text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Instant WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </div>

        {/* Corporate Event Capabilities Grid */}
        <div className="space-y-8">
          <div className="border-b border-neutral-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-amber-600 uppercase tracking-widest font-bold block">Event Specializations</span>
              <h2 className="text-2xl md:text-3xl font-sans uppercase font-bold text-neutral-900 mt-1">
                Designed For Corporate Excellence
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-500 max-w-md">
              Complete in-house hospitality management with private floor leads, custom menus, and presentation technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypesList.map((item) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={item.id}
                  className="bg-neutral-50 border border-neutral-200 p-6 flex flex-col justify-between space-y-6 hover:border-amber-500/50 hover:shadow-md transition-all group text-left"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-neutral-900 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 font-bold uppercase tracking-wider">
                        {item.capacity}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-sans font-bold uppercase text-neutral-900 group-hover:text-amber-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs font-mono text-neutral-600 mt-1.5 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200/80 space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between text-neutral-500">
                      <span>Ideal Timing:</span>
                      <span className="text-neutral-800 font-semibold">{item.timing}</span>
                    </div>
                    <div className="text-neutral-500">
                      <span className="text-amber-700 font-bold">Recommended: </span>
                      <span>{item.popularFor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Venue Spaces & Amenities Showcase */}
        <div className="space-y-8">
          <div className="border-b border-neutral-200 pb-4">
            <span className="text-[11px] font-mono text-amber-600 uppercase tracking-widest font-bold block">Spaces &amp; Capacities</span>
            <h2 className="text-2xl md:text-3xl font-sans uppercase font-bold text-neutral-900 mt-1">
              Private Enclaves &amp; Buyout Options
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {spacesList.map((sp, idx) => (
              <div key={idx} className="border border-neutral-200 bg-white flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={sp.image}
                    alt={sp.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-neutral-950/90 text-amber-400 text-[10px] font-mono font-bold px-2.5 py-1 tracking-wider uppercase border border-amber-500/30">
                    {sp.capacity}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold">
                      {sp.badge}
                    </span>
                    <h3 className="text-lg font-sans font-bold uppercase text-neutral-900">
                      {sp.name}
                    </h3>
                    <p className="text-xs font-mono text-neutral-600 leading-relaxed font-light">
                      {sp.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block tracking-wider">Features Included</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {sp.amenities.map((am, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2 text-[11px] font-mono text-neutral-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{am}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical & Hospitality Infrastructure */}
        <div className="bg-neutral-900 text-white p-8 md:p-12 border border-neutral-800 space-y-8 text-left">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-mono text-amber-400 tracking-widest uppercase font-bold">Seamless Executive Infrastructure</span>
            <h3 className="text-2xl md:text-3xl font-sans uppercase font-light">Everything Your Event Demands, Built In</h3>
            <p className="text-xs font-mono text-neutral-400 leading-relaxed font-light">
              We eliminate the complexity of event coordination by providing integrated AV, fiber connectivity, and white-glove dining under one roof in Lekki.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="p-5 bg-neutral-950 border border-neutral-800 space-y-3">
              <Monitor className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-sans font-bold uppercase text-white">4K Display &amp; Casting</h4>
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                Ultra-HD presentation screens with wireless casting for seamless slide sharing, product demos, and video streaming.
              </p>
            </div>

            <div className="p-5 bg-neutral-950 border border-neutral-800 space-y-3">
              <Wifi className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-sans font-bold uppercase text-white">Gigabit Fiber Wi-Fi</h4>
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                Dedicated enterprise-grade high-speed Internet for live streaming, hybrid video conferencing, and attendee connectivity.
              </p>
            </div>

            <div className="p-5 bg-neutral-950 border border-neutral-800 space-y-3">
              <Coffee className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-sans font-bold uppercase text-white">Master Barista Service</h4>
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                Continuous single-origin espresso, cold brews, and artisan pastries served on demand throughout your sessions.
              </p>
            </div>

            <div className="p-5 bg-neutral-950 border border-neutral-800 space-y-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h4 className="text-sm font-sans font-bold uppercase text-white">Dedicated Coordinator</h4>
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                An on-site event lead and dedicated waitstaff managing run-of-show timing, dietary needs, and guest comfort.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Event Inquiry Form Section */}
        <div id="corporate-inquiry-section" className="bg-neutral-50 border border-neutral-200 p-8 md:p-12 text-left space-y-8">
          <div className="border-b border-neutral-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-amber-600 uppercase tracking-widest font-bold block">Event Request &amp; Proposal</span>
              <h2 className="text-2xl md:text-3xl font-sans uppercase font-bold text-neutral-900 mt-1">
                Book Your Corporate Event
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-500 max-w-md">
              Fill out the details below and our Private Events Director will respond within 4 business hours with a custom proposal.
            </p>
          </div>

          {submittedRef ? (
            <div className="bg-white border-2 border-emerald-500 p-8 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-emerald-700 font-bold uppercase tracking-widest">Inquiry Received Successfully</span>
                <h3 className="text-2xl font-sans font-bold uppercase text-neutral-900">
                  Thank You, {formData.contactName || "Valued Organizer"}
                </h3>
                <p className="text-xs font-mono text-neutral-600 max-w-md mx-auto">
                  Your event inquiry for <strong className="text-neutral-900">{formData.companyName || "your team"}</strong> has been logged under reference code:
                </p>
                <div className="inline-block bg-neutral-100 border border-neutral-300 px-4 py-2 text-base font-mono font-bold text-neutral-900 tracking-wider my-2">
                  {submittedRef}
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  Our Event Coordinator will review your schedule and reach out via email or phone ({formData.phone || formData.workEmail}).
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Now</span>
                </a>

                <button
                  onClick={() => {
                    setSubmittedRef(null);
                    setFormData({
                      companyName: "",
                      contactName: "",
                      workEmail: "",
                      phone: "",
                      eventType: "boardroom_meeting",
                      guestCount: "15",
                      preferredDate: "",
                      timeSlot: "morning",
                      screenRequired: true,
                      layoutStyle: "boardroom",
                      specialNotes: "",
                      budgetRange: "standard"
                    });
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs uppercase tracking-widest font-bold transition-all"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {submitError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Tech Africa Ltd"
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Contact Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Organizer / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Michelle Adeyemi"
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    placeholder="michelle@acmetech.com"
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="080 1234 5678"
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Event Type *
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  >
                    {eventTypesList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected Guest Count */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Expected Number of Guests *
                  </label>
                  <select
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="8-12">8 – 12 Guests (Small Boardroom)</option>
                    <option value="15-25">15 – 25 Guests (Mezzanine Suite)</option>
                    <option value="25-45">25 – 45 Guests (Terrace / Half Hall)</option>
                    <option value="50-80">50 – 80 Guests (Main Dining Hall)</option>
                    <option value="80-120">80 – 120 Guests (Full Venue Buyout)</option>
                  </select>
                </div>

                {/* Preferred Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Time Slot */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="morning">Morning Executive (8:00 AM – 12:00 PM)</option>
                    <option value="afternoon">Lunch &amp; Afternoon Session (12:00 PM – 4:30 PM)</option>
                    <option value="evening">Evening Reception / Dinner (5:00 PM – 10:30 PM)</option>
                    <option value="full_day">Full Day Buyout (8:00 AM – 6:00 PM)</option>
                  </select>
                </div>

                {/* Layout Style */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                    Seating Layout Preference
                  </label>
                  <select
                    value={formData.layoutStyle}
                    onChange={(e) => setFormData({ ...formData, layoutStyle: e.target.value })}
                    className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                  >
                    <option value="boardroom">Boardroom Executive Conference Table</option>
                    <option value="banquet">Banquet Dining Tables (Plated Multi-Course)</option>
                    <option value="u_shape">U-Shape Workshop Layout</option>
                    <option value="cocktail_lounge">Cocktail High-Tops &amp; Lounge Seating</option>
                  </select>
                </div>
              </div>

              {/* Special Requests & Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-700 uppercase font-bold block">
                  Event Objectives, Technical Needs &amp; Dietary Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  placeholder="e.g. We need 4K wireless casting for 12 executive presentations, a customized 3-course plated lunch, gluten-free accommodations, and custom company branding on printed menus."
                  className="w-full p-3 bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Scope Confirmation Check */}
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-neutral-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  By submitting, you confirm that this inquiry is for an in-house private corporate or milestone event hosted at Upside Lekki (we do not provide off-site catering or wedding receptions).
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-amber-600 text-white hover:text-black font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  id="corporate-submit-proposal-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Processing Inquiry..." : "Submit Event Request"}</span>
                </button>

                <div className="text-[11px] font-mono text-neutral-500">
                  <span>Direct Line: </span>
                  <a href="tel:09114646767" className="font-bold text-neutral-900 hover:text-amber-600">0911-464-6767</a>
                  <span> &bull; </span>
                  <a href="mailto:hello@mophethonline.com" className="font-bold text-neutral-900 hover:text-amber-600">hello@mophethonline.com</a>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Corporate FAQ Section */}
        <div className="space-y-6 text-left">
          <h3 className="text-xl font-sans font-bold uppercase text-neutral-900 border-b border-neutral-200 pb-3">
            Corporate &amp; Event Booking FAQs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-neutral-600">
            <div className="p-5 bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900 uppercase">Do you provide off-site catering services?</h4>
              <p className="leading-relaxed font-light">
                No. Upside specializes exclusively in on-site private event hosting and dining within our Lekki establishment to ensure pristine culinary execution, sound design, and service perfection.
              </p>
            </div>

            <div className="p-5 bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900 uppercase">Can we test our presentation display before the event?</h4>
              <p className="leading-relaxed font-light">
                Yes! We encourage corporate event organizers to schedule a 15-minute AV tech check prior to your event date to ensure compatibility with our wireless 4K casting and sound systems.
              </p>
            </div>

            <div className="p-5 bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900 uppercase">Can we customize the menu and include company branding?</h4>
              <p className="leading-relaxed font-light">
                Yes. For private corporate bookings, our Executive Chef can design bespoke multi-course menus, and our creative team can print executive menus with your company logo and event title.
              </p>
            </div>

            <div className="p-5 bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900 uppercase">How far in advance should we secure a booking?</h4>
              <p className="leading-relaxed font-light">
                We recommend booking boardroom meetings and milestone dinners 5 to 14 days in advance. Full venue takeovers should be secured at least 2 to 4 weeks ahead.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
