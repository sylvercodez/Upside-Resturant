import React, { useState, useEffect } from "react";
import { LogIn, LogOut, Clipboard, CheckCircle, Package, User, Phone, MapPin, Eye, ShieldAlert, Key } from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";

export default function RiderDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInRider, setLoggedInRider] = useState<any>(() => {
    const saved = localStorage.getItem("upside_rider_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Auto-refresh/stream assigned orders
  useEffect(() => {
    if (!loggedInRider?.id) return;

    setOrdersLoading(true);
    const q = query(
      collection(db, "orders"),
      where("assignedRiderId", "==", loggedInRider.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort: Active ones first, then completed/delivered ones
        list.sort((a, b) => {
          if (a.status !== "Delivered" && b.status === "Delivered") return -1;
          if (a.status === "Delivered" && b.status !== "Delivered") return 1;
          return b.timestamp - a.timestamp;
        });
        setAssignedOrders(list);
        setOrdersLoading(false);
      },
      (err) => {
        console.error("Error streaming rider orders:", err);
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loggedInRider]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError("Please enter both your Username and Password.");
      return;
    }

    setLoginError(null);
    setIsLoading(true);

    try {
      // Query riders collection for username
      const ridersRef = collection(db, "riders");
      const q = query(ridersRef, where("username", "==", username.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setLoginError("Incorrect Username or Rider profile not found.");
        setIsLoading(false);
        return;
      }

      let matchRider: any = null;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.password === password) {
          matchRider = { id: docSnap.id, ...data };
        }
      });

      if (!matchRider) {
        setLoginError("Incorrect password. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      if (!matchRider.active) {
        setLoginError("This Rider account has been suspended by the Admin. Please contact Logistics.");
        setIsLoading(false);
        return;
      }

      // Successful login
      localStorage.setItem("upside_rider_session", JSON.stringify(matchRider));
      setLoggedInRider(matchRider);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Rider login error:", err);
      setLoginError(`Login system issue: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("upside_rider_session");
    setLoggedInRider(null);
    setAssignedOrders([]);
  };

  const handleMarkAsDone = async (orderId: string) => {
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Delivered",
        updatedAt: new Date().toISOString()
      });

      // Dispatch status update trigger to backend to notify customer & admin
      fetch(getApiUrl("/api/delivery/orders/update-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "Delivered"
        })
      }).catch(err => console.error("Could not trigger delivered status update emails:", err));

      setStatusSuccess(`Order #${orderId.slice(-8).toUpperCase()} marked as Delivered / Completed!`);
    } catch (err: any) {
      console.error("Error setting Delivered:", err);
      setStatusError(`Failed to update order: ${err.message}`);
    }
  };

  if (!loggedInRider) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-black font-mono" id="rider-login-container">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 md:p-8 space-y-6 text-left">
          
          <div className="space-y-1.5 text-center border-b border-neutral-800 pb-4">
            <span className="text-[10px] tracking-widest text-amber-500 font-bold uppercase block">
              Upside Luxury Logistics
            </span>
            <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
              🏍️ Rider Portal Access
            </h4>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-[10px] space-y-1">
              <ShieldAlert className="w-4 h-4 text-rose-500 float-left mr-1.5" />
              <p className="font-bold uppercase">Credential Reject</p>
              <p className="normal-case">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-[11px] text-neutral-300">
            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-bold">@</span>
                <input
                  type="text"
                  required
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 p-2.5 pl-8 text-white focus:outline-none focus:border-amber-500/50 lowercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-500 text-[9px] uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 p-2.5 pl-9 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold uppercase text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Authenticate Portal</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-neutral-500 text-center leading-normal font-sans pt-2">
            Rider login keys are managed of course inside the administrator directory. If you are a delivery partner, please contact dispatch for keys.
          </p>
        </div>
      </div>
    );
  }

  const activeOrders = assignedOrders.filter((o) => o.status !== "Delivered");
  const completedOrders = assignedOrders.filter((o) => o.status === "Delivered");

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8" id="rider-dashboard-view">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header toolbar */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500 rounded-none text-md">
              🏍️
            </div>
            <div>
              <span className="text-[10px] tracking-widest text-[#d97706] font-extrabold uppercase block">
                Logged in as Courier
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {loggedInRider.fullName}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-neutral-500">@{loggedInRider.username}</span>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {statusError && (
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs">
            {statusError}
          </div>
        )}

        {statusSuccess && (
          <div className="p-3.5 bg-emerald-950/25 border border-emerald-900/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            ✓ {statusSuccess}
          </div>
        )}

        {/* Multi tab grid / stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-neutral-900 p-4 text-left border border-neutral-800">
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">Queued Deliveries</p>
            <p className="text-xl font-bold font-mono mt-1 text-amber-500">{activeOrders.length}</p>
          </div>
          <div className="bg-neutral-900 p-4 text-left border border-neutral-800">
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">Completed Deliveries</p>
            <p className="text-xl font-bold font-mono mt-1 text-emerald-500">{completedOrders.length}</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-neutral-900 p-4 text-left border border-neutral-800 font-sans text-[11px] text-neutral-400 space-y-1">
            <p className="text-[10px] text-neutral-500 uppercase font-bold font-mono tracking-wider">Courier Contact Line</p>
            <p className="mt-1 font-mono text-white text-xs">{loggedInRider.phoneNumber}</p>
          </div>
        </div>

        {/* Queued deliveries list */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2 flex justify-between items-center">
            <h5 className="text-xs uppercase font-extrabold tracking-widest text-[#d97706] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Allocated Task Orders ({activeOrders.length})</span>
            </h5>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <span className="w-4 h-4 border border-amber-500 border-t-transparent animate-spin rounded-full" />
              <p className="text-[9px] uppercase tracking-widest text-neutral-500">Locating task assignments...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/10 border border-dashed border-neutral-850 space-y-2 text-neutral-500 rounded-none">
              <Clipboard className="w-8 h-8 mx-auto text-neutral-800" />
              <p className="text-[11px] uppercase tracking-widest font-bold">Lobby Empty / Safe Ride</p>
              <p className="text-[10px] text-neutral-600 max-w-sm mx-auto font-sans leading-relaxed">
                There are no orders assigned to you for dispatch or delivery currently. Take rest or expect admin allocations from the kitchen oven shortly!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-neutral-900 border border-neutral-800 p-5 rounded-none flex flex-col md:flex-row justify-between gap-5 text-left"
                >
                  <div className="space-y-4 flex-grow">
                    {/* ID line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-widest uppercase">
                        #{ord.id?.slice(-8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-950 text-amber-500 text-[9px] uppercase tracking-widest font-black border border-neutral-800">
                        {ord.status || "In Oven"}
                      </span>
                    </div>

                    {/* Client info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] bg-black/40 p-3.5 border border-neutral-850">
                      <div className="space-y-1">
                        <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-black">Customer client</p>
                        <p className="text-white font-bold">{ord.customerName}</p>
                        <p className="text-[10px] text-neutral-400 font-sans flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                          <a href={`tel:${ord.phone}`} className="hover:text-amber-500 hover:underline">{ord.phone}</a>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-black">Delivery Location Address</p>
                        <p className="text-neutral-300 leading-normal flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" />
                          <span className="font-sans text-[10px]">{ord.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Verification Code Container */}
                    <div className="bg-amber-600/10 border-l-2 border-amber-500 p-3 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold block">
                          Pickup / Delivery Verification Code
                        </span>
                        <span className="text-xs font-black font-mono tracking-wider text-amber-500 uppercase block mt-0.5">
                          {ord.verificationCode || "Awaiting code..."}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-400 max-w-xs font-sans italic leading-tight">
                        Confirm this exact code matches the client's confirmation receipt.
                      </span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col justify-end items-stretch md:w-48 gap-2">
                    <button
                      onClick={() => handleMarkAsDone(ord.id)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider cursor-pointer text-center select-none shadow-md flex items-center justify-center gap-1.5 border border-emerald-500/20"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-100" />
                      <span>Mark as Done</span>
                    </button>
                    <a
                      href={`tel:${ord.phone}`}
                      className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 font-bold uppercase text-[10px] tracking-wider text-center select-none block"
                    >
                      Call Customer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History / Completed lists */}
        <div className="space-y-4 pt-4">
          <div className="border-b border-neutral-850 pb-2 flex justify-between items-center">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Completed Deliveries History ({completedOrders.length})
            </h5>
          </div>

          {completedOrders.length === 0 ? (
            <p className="text-[10px] text-neutral-600 font-sans italic py-4">No historic delivered records found under your profile.</p>
          ) : (
            <div className="divide-y divide-neutral-900 border border-neutral-900 bg-neutral-950">
              {completedOrders.slice(0, 10).map((ord) => (
                <div key={ord.id} className="p-3 flex justify-between items-center text-[10.5px]">
                  <div>
                    <span className="font-bold text-neutral-300 tracking-wider font-mono">#{ord.id?.slice(-8).toUpperCase()}</span>
                    <span className="text-neutral-500 font-sans mx-2">|</span>
                    <span className="text-neutral-400 font-sans">Client: {ord.customerName}</span>
                  </div>
                  <span className="text-emerald-500 font-bold uppercase text-[9px]">Delivered ✓</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
