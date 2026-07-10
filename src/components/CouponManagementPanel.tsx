import React, { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { getApiUrl } from "../types";

interface PromoCode {
  code: string;
  discountPercentage: number;
  description: string;
}

const DEFAULT_COUPONS: PromoCode[] = [
  { code: "UPSIDELUXE", discountPercentage: 15, description: "15% off first class dining experience" },
  { code: "LAGOSNIGHTS", discountPercentage: 10, description: "10% off signature night drinks" },
  { code: "KAFE2026", discountPercentage: 20, description: "20% special discount on premium bakery & coffee" }
];

export function CouponManagementPanel() {
  const [coupons, setCoupons] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // New coupon form state
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(getApiUrl("/api/mysql/settings/coupons"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoupons(data);
        } else {
          // Fallback if settings table is empty
          setCoupons(DEFAULT_COUPONS);
        }
      } else if (res.status === 404) {
        // If not found, use default coupons
        setCoupons(DEFAULT_COUPONS);
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err: any) {
      console.warn("Failed to fetch coupons from server, falling back to local storage or presets:", err);
      try {
        const local = localStorage.getItem("transient_coupons");
        if (local) {
          setCoupons(JSON.parse(local));
        } else {
          setCoupons(DEFAULT_COUPONS);
        }
      } catch (_) {
        setCoupons(DEFAULT_COUPONS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const saveCouponsToDb = async (updatedCoupons: PromoCode[]) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      // Save to server database
      const res = await fetch(getApiUrl("/api/mysql/settings/coupons"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedCoupons)
      });

      if (!res.ok) {
        throw new Error(`Failed to save. Server returned ${res.status}`);
      }

      setCoupons(updatedCoupons);
      setSuccess("Coupon configurations updated successfully!");
      
      // Also sync to local storage as double redundancy
      localStorage.setItem("transient_coupons", JSON.stringify(updatedCoupons));
    } catch (err: any) {
      console.error("Failed to save coupons to DB:", err);
      setError(`Error saving to database: ${err.message || err}. Saved locally instead.`);
      setCoupons(updatedCoupons);
      localStorage.setItem("transient_coupons", JSON.stringify(updatedCoupons));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const code = newCode.trim().toUpperCase();
    const discount = parseInt(newDiscount.trim(), 10);
    const description = newDescription.trim();

    if (!code) {
      setError("Coupon code is required.");
      return;
    }
    if (isNaN(discount) || discount < 1 || discount > 100) {
      setError("Discount percentage must be a number between 1 and 100.");
      return;
    }
    if (!description) {
      setError("Description is required.");
      return;
    }

    if (coupons.some(c => c.code === code)) {
      setError(`A coupon with code "${code}" already exists.`);
      return;
    }

    const updated = [...coupons, { code, discountPercentage: discount, description }];
    await saveCouponsToDb(updated);

    // Clear form inputs
    setNewCode("");
    setNewDiscount("");
    setNewDescription("");
  };

  const handleDeleteCoupon = async (codeToDelete: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${codeToDelete}"?`)) {
      return;
    }
    const updated = coupons.filter(c => c.code !== codeToDelete);
    await saveCouponsToDb(updated);
  };

  const handleResetToDefault = async () => {
    if (!confirm("Are you sure you want to reset all coupons to standard presets? This will overwrite any custom coupons.")) {
      return;
    }
    await saveCouponsToDb(DEFAULT_COUPONS);
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-6 text-left rounded-xl shadow-sm" id="sales-coupon-manager-panel">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4 gap-4">
        <div>
          <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-900 uppercase flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-600" />
            <span>Sales Promo Coupon Manager</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1 font-sans">
            Create, update, and manage promotional coupons and discounts for client checkouts.
          </p>
        </div>
        <button
          onClick={handleResetToDefault}
          disabled={isSaving}
          className="text-[10px] uppercase font-bold tracking-wider font-mono text-red-600 hover:text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          id="btn-reset-coupons"
        >
          Reset to Presets
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 text-xs px-4 py-3 rounded-lg flex items-start gap-2.5 font-sans">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs px-4 py-3 rounded-lg flex items-start gap-2.5 font-sans">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to add a coupon */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-50 p-5 border border-neutral-200/80 rounded-xl space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-800 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Add New Coupon</span>
            </h3>

            <form onSubmit={handleAddCoupon} className="space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. EXTRA50"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-black font-mono uppercase text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 shadow-sm"
                  id="input-coupon-code"
                />
                <p className="text-[9px] text-neutral-400 font-sans">
                  The alphanumeric code customers type in to get the discount (auto uppercase).
                </p>
              </div>

              {/* Discount Percentage */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  min="1"
                  max="100"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 shadow-sm"
                  id="input-coupon-discount"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15% discount for weekend breakfast sales"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-black text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 shadow-sm"
                  id="input-coupon-desc"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-neutral-900 hover:bg-black text-white text-xs font-mono uppercase tracking-widest font-extrabold py-3 rounded-lg transition-all cursor-pointer shadow flex justify-center items-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                id="btn-add-coupon-submit"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Coupon</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Table of Active Coupons */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-200 flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-700">
                Active Promo Coupons ({coupons.length})
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase">
                Dynamic Store Rules
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center space-y-2">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full" />
                <p className="text-xs text-neutral-500 font-mono">Fetching active promos...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-xs font-mono space-y-2">
                <Ticket className="w-8 h-8 mx-auto text-neutral-300 stroke-1" />
                <p>No active promo coupons configured.</p>
                <p className="text-[10px] text-neutral-400 font-sans">Use the form to create one!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/50 text-[10px] font-mono text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                      <th className="px-5 py-3 font-bold">Code</th>
                      <th className="px-5 py-3 font-bold text-center">Discount</th>
                      <th className="px-5 py-3 font-bold">Offer Description</th>
                      <th className="px-5 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {coupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-neutral-55/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-extrabold text-neutral-900 tracking-wider">
                          {coupon.code}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            {coupon.discountPercentage}% OFF
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-600 font-sans">
                          {coupon.description}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            disabled={isSaving}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                            title="Delete Coupon"
                            id={`btn-delete-coupon-${coupon.code.toLowerCase()}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
