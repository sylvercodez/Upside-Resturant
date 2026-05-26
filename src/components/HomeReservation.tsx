import React, { useState } from "react";
import { Calendar, Clock, Users, CheckCircle, Shield, Sparkles, Award, MapPin } from "lucide-react";

export default function HomeReservation() {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "19:30",
    guests: "2",
    seatingArea: "Vanguard Lounge",
    specialOccasion: "",
    specialRequests: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate high-end digital table routing and SMS verification dispatch
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1800);
  };

  return (
    <section className="bg-neutral-950 py-20 px-4 border-t border-b border-neutral-900" id="home-reservation-section">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT SIDE: LUXURY BRAND TEXT */}
          <div className="lg:col-span-5 space-y-6 text-left" id="home-reservation-brand">
            <div className="space-y-2">
              <span className="text-[10px] text-amber-500 font-mono tracking-[0.2em] uppercase font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Bespoke Table Allocations</span>
              </span>
              <h2 className="text-3xl md:text-4xl text-white font-light tracking-tight uppercase">
                SECURE YOUR <span className="font-serif italic text-amber-500 font-normal">SANCTUARY</span> EXPERIENCE
              </h2>
            </div>
            
            <p className="text-neutral-400 text-sm leading-relaxed font-light">
              Experience the masterwork of Upside Lagos. Secure an acoustic dinner slot, celebrate milestones, or lock a private booth in our sound-buffered Vanguard Lounge. Complete our live reservation dispatch system below for instant hostess feedback.
            </p>

            <div className="space-y-4 pt-4 border-t border-neutral-900/60" id="home-reservation-highlights">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-900 border border-neutral-800 text-amber-500 mt-1">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Lekki Sanctuary Location</h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">Plot 12 Admiralty Way, Lekki Phase 1, Lagos</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-neutral-900 border border-neutral-800 text-amber-500 mt-1">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Premium Service Slots</h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">Continuous kitchen dining open Wed - Sun, 12:00 PM till late night hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-neutral-900 border border-neutral-800 text-amber-500 mt-1">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Exclusive Lounge Perks</h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">Complimentary mocktail greeting on arrival with all confirmed special occasion bookings.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: RESERVATION BOOKING CARD FORM */}
          <div className="lg:col-span-7" id="home-reservation-card-form">
            <div className="bg-black border border-neutral-900 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6 text-left" id="home-reservation-booking-form">
                  <div className="space-y-1">
                    <h3 className="text-sm font-mono font-bold tracking-widest text-amber-500 uppercase">
                      ONLINE CONCIERGE ASSIGNMENT
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      Locked tables are held for exactly 15 minutes. No booking deposit is required.
                    </p>
                  </div>

                  {/* Flexible responsive input grid preventing unwanted font wrapping */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    
                    {/* Date select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-1.5 font-bold whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Date</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none cursor-pointer"
                      />
                    </div>

                    {/* Timeslot option list */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-1.5 font-bold whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Timeslot</span>
                      </label>
                      <select
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        <option value="12:00">12:00 PM (Brunch Menu)</option>
                        <option value="14:00">02:00 PM (Lagos Cafe Hour)</option>
                        <option value="16:00">04:00 PM (Sunset Mocktails)</option>
                        <option value="18:00">06:00 PM (Golden Dinner Slot)</option>
                        <option value="19:30">07:30 PM (Vanguard Club Dining)</option>
                        <option value="21:00">09:00 PM (Late Night Grills)</option>
                        <option value="22:30">10:30 PM (Nightcap Session)</option>
                      </select>
                    </div>

                    {/* Attendees count */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-1.5 font-bold whitespace-nowrap">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>Attendees</span>
                      </label>
                      <select
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                          <option key={num} value={num} className="bg-black text-white">
                            {num} {num === 1 ? "Elite Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fullname input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase font-bold whitespace-nowrap">Guest Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="E.g., Tosin Otenaike"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                      />
                    </div>

                    {/* Email address input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase font-bold whitespace-nowrap">Active Contact Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="E.g., tosin@example.com"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                      />
                    </div>

                    {/* Phone number input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400 uppercase font-bold whitespace-nowrap">Mobile Phone Line</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="E.g., +234 912 345 6789"
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                      />
                    </div>

                    {/* Celebration / Occasion - Span both columns for wide layout luxury feel */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-neutral-400 uppercase font-bold whitespace-nowrap">Are you celebrating?</label>
                      <select
                        name="specialOccasion"
                        value={formData.specialOccasion}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none cursor-pointer font-bold text-ellipsis overflow-hidden"
                      >
                        <option value="" className="bg-black text-white">None (Standard Casual table)</option>
                        <option value="Birthday" className="bg-black text-white">Birthday Milestone Celebration</option>
                        <option value="Anniversary" className="bg-black text-white">Romantic Wedding Anniversary</option>
                        <option value="Business Deal" className="bg-black text-white">Business Transaction Luncheon</option>
                        <option value="Proposal" className="bg-black text-white">Engagement Proposal setup</option>
                      </select>
                    </div>

                    {/* Dietary restrictions / Preferences text area - Span both columns */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-mono text-neutral-400 uppercase font-bold whitespace-nowrap">Special Dietary Requests / Preferences</label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        placeholder="E.g., Allergies to nuts, flower bouquet setup, request window booth..."
                        className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none h-16 resize-none"
                      />
                    </div>

                  </div>

                  <div className="flex items-start gap-2.5 text-neutral-500 font-mono text-[10px] leading-relaxed pt-2">
                    <Shield className="w-4 h-4 text-amber-500/80 flex-shrink-0 mt-0.5" />
                    <p>
                      Bespoke VIP accommodations carry dynamic minimum spend limits during live saxophone & acoustic evenings. Confirmation notification dispatches inside SMS channels instantly.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4.5 bg-amber-500 text-black font-extrabold text-xs font-mono tracking-widest uppercase hover:bg-amber-400 disabled:opacity-50 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? "SECURING TABLE DISPATCH..." : "DISPATCH TABLE BOOKING REGISTRATION"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 space-y-6 animate-fadeIn text-left" id="home-reservation-success-state">
                  <div className="w-16 h-16 bg-neutral-900 border border-amber-500 text-amber-500 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 stroke-1 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9.5px] tracking-[0.2em] text-amber-500 font-mono uppercase font-bold block animate-pulse">
                      ALLOCATION LOCKED SUCCESSFULLY
                    </span>
                    <h3 className="text-xl md:text-2xl text-white font-sans tracking-widest uppercase font-bold">
                      TABLE RESERVED
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto font-mono leading-relaxed">
                      Gratitude. We have mapped out a bespoke seating arrangement for your luxury experience at Upside Lekki.
                    </p>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-none text-left space-y-2.5 max-w-md mx-auto font-mono text-xs text-neutral-300">
                    <div className="flex justify-between border-b border-neutral-800 pb-1.5 text-neutral-400">
                      <span>Assigned Host:</span>
                      <strong className="text-white uppercase">{formData.name}</strong>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Lodge Location:</span>
                      <span className="text-amber-500 font-bold uppercase">{formData.seatingArea}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Attendees:</span>
                      <span className="text-white font-semibold">{formData.guests} Guests</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Target Slot:</span>
                      <span className="text-white font-semibold">{formData.date} at {formData.time} PM</span>
                    </div>
                    {formData.specialOccasion && (
                      <div className="flex justify-between text-neutral-400">
                        <span>Milestone:</span>
                        <span className="text-amber-300 font-bold uppercase">{formData.specialOccasion}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-400 pt-1.5 border-t border-neutral-800">
                      <span>Prep Tracker:</span>
                      <span className="text-emerald-500 flex items-center gap-1.5 uppercase font-bold">
                        ● Hostess Confirmed
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSuccess(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        date: "",
                        time: "19:30",
                        guests: "2",
                        seatingArea: "Vanguard Lounge",
                        specialOccasion: "",
                        specialRequests: ""
                      });
                    }}
                    className="px-8 py-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-amber-500 font-bold text-xs tracking-widest font-mono uppercase transition-colors cursor-pointer w-full text-center max-w-md mx-auto block"
                  >
                    Reserve Another Table
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
