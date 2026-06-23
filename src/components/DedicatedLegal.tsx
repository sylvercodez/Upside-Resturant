import React, { useState } from "react";
import { ArrowLeft, Shield, Scale, Calendar, HelpCircle, FileText, CheckCircle, Scroll } from "lucide-react";

interface DedicatedLegalProps {
  onBackToLobby: () => void;
  initialTab?: "terms" | "privacy";
}

export default function DedicatedLegal({ onBackToLobby, initialTab = "terms" }: DedicatedLegalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

  const lastUpdated = "June 22, 2026";

  return (
    <div className="bg-neutral-50 min-h-screen pt-28 pb-16 px-4 text-neutral-900 font-sans" id="dedicated-legal-page">
      <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn text-left">
        
        {/* Navigation / Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <button
            onClick={onBackToLobby}
            className="group flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer self-start"
            id="legal-back-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Sanctuary Lobby</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>UPSIDE RESTAURANT</span>
            <span>/</span>
            <span className="text-amber-600">LEGAL COMPLIANCE LEDGER</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white border border-neutral-200 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-sans font-light tracking-tight text-neutral-900 uppercase">
              Compliance & Legal Sanctuary
            </h1>
            <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase leading-relaxed max-w-xl">
              Transparency in gourmet digital hospitality. Review our terms of culinary service, reservation commitments, and personal data safety metrics.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-400 uppercase pt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Last Revised: {lastUpdated}</span>
              </span>
              <span>&bull;</span>
              <span>Lekki Ikate Elegushi Sanctuary</span>
            </div>
          </div>
          
          <div className="flex shrink-0 gap-3">
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-5 py-3 font-mono text-xs uppercase tracking-wider transition-all border flex items-center gap-2 cursor-pointer ${
                activeTab === "terms"
                  ? "bg-neutral-900 border-neutral-900 text-white font-bold"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
              id="tab-btn-terms"
            >
              <Scale className="w-4 h-4" />
              <span>Terms of Service</span>
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-5 py-3 font-mono text-xs uppercase tracking-wider transition-all border flex items-center gap-2 cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-neutral-900 border-neutral-900 text-white font-bold"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
              id="tab-btn-privacy"
            >
              <Shield className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Quick Jumps Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-neutral-200 p-6 sticky top-28 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                Document Summary
              </h4>
              <ul className="space-y-3.5 text-xs text-neutral-500 font-mono">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">100% Secure Checkout via OPay and Paystack integration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">Real-time status tracking via automated email logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">Strict reservation policy covering tables and lounge seating.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">Zero-sale data privacy pledge. No data is ever shared with third-party aggregators.</span>
                </li>
              </ul>

              <div className="bg-amber-50 p-4 border border-amber-100 text-[11px] font-sans text-neutral-700 space-y-2 rounded-none">
                <p className="font-bold uppercase text-amber-900 tracking-wider font-mono text-[10px]">
                  Concierge Support Desk
                </p>
                <p className="leading-relaxed">
                  Have a compliance query or reservation concern? Connect with the legal team at:
                </p>
                <p className="font-mono font-bold text-neutral-900">
                  legal@upsidelagos.com
                </p>
              </div>
            </div>
          </div>

          {/* Core Content Box */}
          <div className="lg:col-span-3 bg-white border border-neutral-200 p-8 md:p-12 shadow-sm min-h-[600px] prose prose-amber max-w-none">
            
            {activeTab === "terms" ? (
              <div className="space-y-8" id="terms-content-view">
                
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl md:text-2xl font-sans font-light text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                    <Scroll className="w-6 h-6 text-amber-500" />
                    Terms of Culinary Service
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    UP-TOS-2026-V1 &bull; REVISITED JUNE 2026
                  </p>
                </div>

                <div className="space-y-6 text-sm text-neutral-600 leading-relaxed font-sans">
                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      1. Introduction & Binding Effect
                    </h3>
                    <p>
                      Welcome to the digital platform of <strong>Upside Restaurant & Café</strong>, operated under the parent corporate legacy of <strong>Mopheth</strong>. By accessing our platform, placing gourmet orders, finalizing reservation requests, or utilizing our tableside QR code scanning tools, you irrevocably agree to comply with and be bound by the terms detailed herein. If you object to any portion, please exit immediately.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      2. Food Preparation & Allergen Notice
                    </h3>
                    <p>
                      Our dishes are crafted by certified culinary teams at our Lekki Sanctuary location. Due to custom roasting, baking, and direct flame grilling, we utilize milk, eggs, nuts, wheat, seafood, and soy in-house. While our kitchen applies stringent segregation protocols, we cannot guarantee 100% allergen-free environments. Clients with life-threatening food allergies are required to declare them to the head maître d' prior to order dispatch or table seating.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      3. Digital Billing & Non-Refundable Deposit Guarantees
                    </h3>
                    <p>
                      All electronic transactions are processed securely through certified integrations with <strong>OPay Nigeria</strong> and <strong>Paystack</strong>. Table reservation deposits:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 font-mono text-neutral-500 text-xs">
                      <li>Standard Table Bookings require a commitment charge of ₦10,000, 100% redeemable against food and beverages.</li>
                      <li>Elite VIP Lounge Bookings carry structural minimum spending thresholds as displayed dynamically on checkout.</li>
                      <li>Reservations must be cancelled at least 24 hours prior to the reservation time slot to receive a valid reschedule credit. Failure to cancel in this window constitutes structural default and results in complete loss of deposit.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      4. Gourmet Delivery & Security Verification Code Rules
                    </h3>
                    <p>
                      To ensure security of luxury dining packages, each order is assigned a unique, system-generated <strong>6-digit verification code</strong>.
                    </p>
                    <p>
                      Upon arrival of your assigned rider, you must disclose and verify this code. Delivery is considered legally completed only once the verification code is entered. Our drivers will not hand over food packages without this verification.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      5. Electronic ERP Communications
                    </h3>
                    <p>
                      We process delivery notifications, cooking statuses, and system changes through direct email communication. By placing an order, you subscribe to state transition logs. You may opt out of promotional newsletters, but system operational logs (such as order status changes) remain an essential part of service delivery and cannot be opted out of.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      6. Governing Law & Dispute Resolution
                    </h3>
                    <p>
                      These Terms are governed by, construed, and enforced in accordance with the laws of the Federal Republic of Nigeria. Any litigation, dispute, or claim arising from this contract shall be submitted to binding arbitration in Lagos State, Nigeria.
                    </p>
                  </section>
                </div>

              </div>
            ) : (
              <div className="space-y-8" id="privacy-content-view">
                
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl md:text-2xl font-sans font-light text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-6 h-6 text-amber-500" />
                    Data Safety & Privacy Policy
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    UP-PRIVACY-2026-V1 &bull; REVISITED JUNE 2026
                  </p>
                </div>

                <div className="space-y-6 text-sm text-neutral-600 leading-relaxed font-sans">
                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      1. Principles of Personal Ledger Security
                    </h3>
                    <p>
                      Your privacy is of senior importance to our group. This policy details how we process contact information, delivery routes, and digital transactional parameters when interacting with the Upside Restaurant & Café web application.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      2. Information We Actively Collect
                    </h3>
                    <p>
                      To process orders and dispatch precise routing logistics to our division riders, we collect:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 font-mono text-neutral-500 text-xs">
                      <li>Identity Ledger: Full name, phone contact, and digital email reference.</li>
                      <li>Location Metrics: Geographic delivery addresses, area selections, and tableside QR location identifiers.</li>
                      <li>Transaction logs: Order contents, bills paid, transaction dates, and custom dining preferences.</li>
                    </ul>
                    <p>
                      We do not store complete raw credit cards, pins, or banking keys on our host machines. All payment operations are proxied via compliant external gateways (OPay and Paystack), protecting your credentials.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      3. Operational Processing Goals
                    </h3>
                    <p>
                      Your personal metrics are channeled exclusively into these vital actions:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-500 font-mono">
                      <li>Fulfilling orders, preparing custom sensory menu guides, and managing seatings.</li>
                      <li>Dispatching automated email updates (commencement of prep, tracking links, rider dispatch log alerts).</li>
                      <li>Syncing location addresses with direct routing coordinates.</li>
                      <li>Performing fraud checks for security compliance across our network.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      4. Data Storage and Retention Thresholds
                    </h3>
                    <p>
                      All files are stored in our secured Google Cloud Firestore database instance. Accounts, transaction summaries, and reservation dates remain persisted in the digital database to compile your order histories and points. Guest operations are retained only as long as necessary to complete, and audit the accounting lines.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      5. Your Rights & Erasure Policies
                    </h3>
                    <p>
                      You have full sovereignty over your metrics registered in our database. You can request a digital ledger export or initiate a request to purge your personal information from our database completely. Direct all erase queries to <strong className="text-neutral-900">privacy@upsidelagos.com</strong>.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-sans font-semibold text-neutral-900 text-base uppercase tracking-wider">
                      6. Secure Infrastructure Auditing
                    </h3>
                    <p>
                      We regularly scan firewalls, database rules, and code to guarantee compliance with the Nigeria Data Protection Regulation (NDPR) and other international standards. Your connection with our workspace is fully encrypted using SSL.
                    </p>
                  </section>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
