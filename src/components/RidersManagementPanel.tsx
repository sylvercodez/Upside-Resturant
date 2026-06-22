import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Power, User, Phone, Mail, ShieldAlert, Key } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface Rider {
  id: string;
  fullName: string;
  phoneNumber: string;
  username: string;
  password?: string;
  email?: string;
  active: boolean;
}

export default function RidersManagementPanel() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [active, setActive] = useState(true);

  // Load riders
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "riders"),
      (snapshot) => {
        const ridersList: Rider[] = [];
        snapshot.forEach((docSnap) => {
          ridersList.push({ id: docSnap.id, ...docSnap.data() } as Rider);
        });
        setRiders(ridersList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching riders:", err);
        setError("Failed to stream riders. Check your permissions.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFullName("");
    setPhoneNumber("");
    setUsername("");
    setPassword("");
    setEmail("");
    setActive(true);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !username || !password) {
      setError("Please fill out all required fields: Full Name, Phone, Username, Password.");
      return;
    }

    // Check duplicate username (except when editing the same rider)
    const isDuplicate = riders.some(
      (r) => r.username.toLowerCase() === username.toLowerCase() && r.id !== editingId
    );
    if (isDuplicate) {
      setError("Username already exists. Please choose a unique username.");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const riderId = editingId || `rider_${Date.now()}`;
      const riderPayload: Partial<Rider> = {
        fullName,
        phoneNumber,
        username,
        password,
        email: email || "",
        active,
      };

      await setDoc(doc(db, "riders", riderId), riderPayload, { merge: true });
      setSuccess(editingId ? "Rider information updated!" : "New active Rider created successfully!");
      resetForm();
    } catch (err: any) {
      console.error("Error saving rider:", err);
      setError(`Failed to save rider: ${err.message}`);
    }
  };

  const handleToggleActive = async (rider: Rider) => {
    try {
      await updateDoc(doc(db, "riders", rider.id), {
        active: !rider.active,
      });
      setSuccess(`Rider status set to ${!rider.active ? "Active" : "Deactivated"}`);
    } catch (err: any) {
      setError(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleEditClick = (rider: Rider) => {
    setIsEditing(true);
    setEditingId(rider.id);
    setFullName(rider.fullName);
    setPhoneNumber(rider.phoneNumber);
    setUsername(rider.username);
    setPassword(rider.password || "");
    setEmail(rider.email || "");
    setActive(rider.active);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteRider = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rider permanently?")) return;
    try {
      await deleteDoc(doc(db, "riders", id));
      setSuccess("Rider deleted successfully!");
    } catch (err: any) {
      setError(`Failed to delete rider: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" id="riders-management-panel">
      {/* Overview Block */}
      <div className="bg-neutral-900 border-l-4 border-amber-600 p-5 rounded-none space-y-2">
        <span className="text-[10px] tracking-widest text-[#d97706] font-mono font-bold uppercase block">
          Logistic Services Control
        </span>
        <h4 className="text-sm font-semibold tracking-wider font-mono text-white uppercase">
          Rider Management System
        </h4>
        <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
          Create, modify, suspend, or reactivate logistic dispatch riders. In-Oven orders inside the orders pipeline can be allocated to active riders here.
        </p>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="xl:col-span-1 bg-neutral-950 border border-neutral-800 p-5 font-mono text-left">
          <h5 className="text-[11px] uppercase tracking-widest font-black text-white border-b border-neutral-800 pb-2 mb-4">
            {isEditing ? "📝 Edit Dispatch Rider" : "➕ Register New Rider"}
          </h5>

          {error && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-400 text-[10px] mb-4 space-y-1">
              <ShieldAlert className="w-4 h-4 text-rose-500 float-left mr-2" />
              <p className="font-bold uppercase tracking-tight">Access / Payload Reject</p>
              <p className="normal-case">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] mb-4 font-bold uppercase tracking-wide">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSaveRider} className="space-y-4 text-[11px]">
            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Babajide Alao"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 pl-9 text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 08012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 pl-9 text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Username (Login Key) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600 font-extrabold">@</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. jide_rider"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 pl-9 text-neutral-200 focus:outline-none focus:border-amber-500/50 lowercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Secret Password *</label>
              <div className="relative">
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="text"
                  required
                  placeholder="e.g. securePass123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 pl-9 text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="email"
                  placeholder="e.g. rider@upsidelagos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 pl-9 text-neutral-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-amber-500"
              />
              <label htmlFor="active" className="text-neutral-400 font-bold select-none cursor-pointer">
                Rider Account Active
              </label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold uppercase text-center transition-all cursor-pointer"
              >
                {isEditing ? "Save Changes" : "Register Rider"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white uppercase transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Directory List panel */}
        <div className="xl:col-span-2 bg-neutral-950 border border-neutral-800 p-5 font-mono text-left">
          <h5 className="text-[11px] uppercase tracking-widest font-black text-white border-b border-neutral-800 pb-2 mb-4 flex items-center justify-between">
            <span>🏍️ Active Riders Team</span>
            <span className="text-[9px] px-2 py-0.5 bg-neutral-900 border border-neutral-850 text-amber-500 font-bold">
              {riders.length} registered
            </span>
          </h5>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Querying logistic database...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-neutral-500 border border-dashed border-neutral-850">
              <p className="text-[10px] uppercase tracking-widest font-black">Rider Registry Empty</p>
              <p className="text-[9px] text-neutral-600 max-w-xs mx-auto">No agency delivery agents have been introduced. Onboard a new partner rider on the left side form to commence dispatching.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riders.map((r) => (
                <div
                  key={r.id}
                  className={`border p-4 space-y-3 transition-colors ${
                    r.active
                      ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                      : "bg-neutral-950 border-neutral-900 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="text-xs font-bold text-white uppercase">{r.fullName}</h6>
                      <p className="text-[10px] text-amber-500 font-bold lowercase mt-0.5">@{r.username}</p>
                    </div>
                    <span
                      className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-none uppercase ${
                        r.active
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                          : "bg-rose-955/40 text-rose-500 border border-rose-900/40"
                      }`}
                    >
                      {r.active ? "Active" : "Suspended"}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] text-neutral-400">
                    <p className="flex items-center gap-1.5 font-sans">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span>{r.phoneNumber}</span>
                    </p>
                    {r.email && (
                      <p className="flex items-center gap-1.5 font-sans">
                        <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                        <span className="truncate">{r.email}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 pt-1 font-mono border-t border-neutral-850 mt-1">
                      <span className="text-neutral-600 text-[9px] uppercase">PWD Key:</span>
                      <span className="text-neutral-200">{r.password}</span>
                    </p>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-850 mt-2 text-[9px] uppercase">
                    <button
                      onClick={() => handleEditClick(r)}
                      className="flex-shrink-0 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(r)}
                      className={`px-2 py-1 flex items-center gap-1 cursor-pointer transition-all ${
                        r.active
                          ? "bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:bg-rose-900 hover:text-white"
                          : "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900 hover:text-white"
                      }`}
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{r.active ? "Suspend" : "Activate"}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRider(r.id)}
                      className="ml-auto p-1 bg-red-950/20 border border-red-920 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-all"
                      title="Deletes rider forever"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
