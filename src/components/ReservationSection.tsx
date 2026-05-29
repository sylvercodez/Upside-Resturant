import React, { useState } from "react";
import { Calendar, Clock, Users, CheckCircle, Shield, Award, Sparkles } from "lucide-react";
import { Reservation } from "../types";

interface ReservationSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationSection({ isOpen, onClose }: ReservationSectionProps) {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    seatingArea: "Standard",
    specialOccasion: "",
    specialRequests: ""
  });

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-neutral-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-black">
        
        {/* Banner with visual branding */}
        <div className="relative h-44 bg-neutral-50 border-b border-neutral-200 p-8 flex flex-col justify-end">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            <img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000"
              alt="Luxury Table Settings"
              className="w-full h-full object-cover opacity-25"
            />
          </div>
          <div className="relative z-10 space-y-1 text-left">
            <span className="text-[10px] text-amber-600 font-mono tracking-widest uppercase font-bold">
              Digital Table Reservation
            </span>
            <h3 className="text-2xl md:text-3xl text-neutral-900 font-serif font-light leading-none">
              Upside Sanctuary <span className="font-serif italic text-amber-600">Lekki</span>
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">
              Secure immediate table assignment for fine dining and acoustic nights.
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 border border-neutral-200 p-2 text-neutral-800 hover:text-amber-600 hover:bg-neutral-50 rounded-full cursor-pointer shadow-sm"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Reservation Forms */}
        <div className="p-6 md:p-8">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              
              {/* Grid 1: Date, Time & Guests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-600 uppercase flex items-center gap-1.5 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Select Date *</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-600 uppercase flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Select Time *</span>
                  </label>
                  <select
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  >
                    <option value="">Choose Timeslot</option>
                    <option value="12:00">12:00 PM (Brunch & Luncheon)</option>
                    <option value="14:00">02:00 PM (Lagos Cafe Hour)</option>
                    <option value="16:00">04:00 PM (Sunset Tea & Mocktails)</option>
                    <option value="18:00">06:00 PM (Golden Dinner Slot)</option>
                    <option value="19:30">07:30 PM (Vanguard Club Dining)</option>
                    <option value="21:00">09:00 PM (Late Night Premium Grills)</option>
                    <option value="22:30">10:30 PM (Ambient Nightcap Session)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-neutral-600 uppercase flex items-center gap-1.5 font-bold">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Party Size *</span>
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Elite Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 3: Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="E.g., Tosin Otenaike"
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Contact Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E.g., guest@example.com"
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Active Mobile Line *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="E.g., +234 90..."
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                </div>
              </div>

              {/* Grid 4: Special Occasion & Special Requests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Celebrate Special Occasion?</label>
                  <select
                    name="specialOccasion"
                    value={formData.specialOccasion}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  >
                    <option value="">None (Casual Luxury dining)</option>
                    <option value="Birthday">Birthday Milestone</option>
                    <option value="Anniversary">Romantic Anniversary</option>
                    <option value="Business Deal">Business Executive Luncheon</option>
                    <option value="Proposal">Engagement Proposal setup</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">Special Dietary / Seating Requests</label>
                  <input
                    type="text"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="E.g., Gluten allergy, low music volume, wheelchair link..."
                    className="w-full bg-white border border-neutral-300 text-black font-mono text-xs p-3.5 focus:outline-none focus:border-amber-500 rounded-none"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 text-neutral-500 font-mono text-[9px] leading-relaxed">
                <Shield className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p>
                  By submitting this request, you acknowledge that holding times are exactly 15 minutes past target slot. 
                  VIP lounges carry variable minimum spends matching live Afrobeat artist schedules. Email confirmation will instantly propagate.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-4 border border-neutral-200 text-neutral-600 text-xs font-mono tracking-widest uppercase hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-4 bg-black text-white font-semibold text-xs font-mono tracking-widest uppercase hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Securing Table Allocation..." : "Lock Table Reservation"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 bg-amber-50 border border-amber-600 text-amber-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 stroke-1" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] tracking-widest text-amber-600 font-mono uppercase font-bold block animate-pulse">
                  Reservation Dispatched
                </span>
                <h3 className="text-xl font-sans tracking-widest text-neutral-900 uppercase font-black">
                  Table Allocation Locked!
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto font-mono leading-relaxed">
                  Excellent choice. We have mapped out a premium spot for you at Upside Lekki.
                </p>
              </div>

              {/* Confirmed Details Block */}
              <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-none text-left space-y-2 max-w-md mx-auto font-mono text-xs text-neutral-600">
                <div className="flex justify-between text-neutral-600">
                  <span>Host Name:</span>
                  <span className="text-black font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Party Size:</span>
                  <span className="text-black font-semibold">{formData.guests} guests</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Target Date:</span>
                  <span className="text-black font-semibold">{formData.date}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Target Time:</span>
                  <span className="text-black font-semibold">{formData.time} PM</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Status:</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-semibold block uppercase">
                    ● Allocated Directly
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="px-8 py-3.5 bg-black text-white font-semibold text-xs tracking-widest font-mono uppercase hover:bg-neutral-900 transition-colors cursor-pointer w-full text-center max-w-md mx-auto block"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline missing Minus icon inside component or use Lucide
function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="12" x2="6" y2="12"></line>
    </svg>
  );
}
