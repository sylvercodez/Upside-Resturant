import React, { useState } from "react";
import { X, Lock, Mail, User, Eye, EyeOff, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import OrderHistory from "./OrderHistory";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  currentUser?: FirebaseUser | null;
  onLogout?: () => void;
  onTrackOrder?: (order: any) => void;
  onReorder?: (items: any[]) => void;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = "signin",
  currentUser,
  onLogout,
  onTrackOrder,
  onReorder
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  if (currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div 
          className="relative w-full max-w-lg bg-[#121212] border border-amber-900/30 text-white shadow-2xl overflow-hidden" 
          id="luxury-vip-dashboard"
        >
          {/* Decorative ambient borders */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />

          {/* Modal Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 z-10 cursor-pointer"
            aria-label="Close VIP Dashboard"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 space-y-6">
            {/* VIP Club Header Status */}
            <div className="flex items-center gap-4 bg-neutral-900/60 p-4 border border-neutral-800 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none">
                <ShieldCheck className="w-full h-full text-amber-500 scale-125" />
              </div>
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-mono text-base font-extrabold uppercase shadow-lg select-none">
                {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : currentUser.email?.slice(0, 2).toUpperCase() || "VIP"}
              </div>
              <div className="space-y-1 text-left flex-grow">
                <span className="text-[9px] tracking-[0.25em] text-amber-500 font-mono font-bold uppercase block leading-none">
                  GOLD STANDARD VIP MEMBER
                </span>
                <h3 className="text-base font-bold font-mono text-white tracking-wide uppercase leading-tight truncate">
                  {currentUser.displayName || "GUEST MEMBER"}
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono block leading-none">
                  {currentUser.email}
                </span>
              </div>
            </div>

            {/* Embedded Order History Section */}
            <div className="space-y-3">
              <OrderHistory 
                onTrackClick={(order) => {
                  if (onTrackOrder) {
                    onTrackOrder(order);
                  }
                  onClose();
                }}
                onReorderClick={(items) => {
                  if (onReorder) {
                    onReorder(items);
                  }
                  onClose();
                }}
              />
            </div>

            {/* Bottom Controls / Action Bar */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onLogout}
                className="flex-1 py-3 bg-[#181818] border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-white font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
                id="vip-modal-logout-btn"
              >
                Sign Out Account
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
                id="vip-modal-close-btn"
              >
                Return to Explore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getCleanAuthError = (err: any): string => {
    const code = err?.code;
    let msg = err?.message || "";
    
    // Check code and message in a unified lowercase format for extreme matches
    const errString = `${code || ""} ${msg}`.toLowerCase();
    
    if (errString.includes("email-already-in-use") || errString.includes("email already in use")) {
      return "This email address is already registered. Please proceed with logging in instead.";
    }
    if (errString.includes("user-not-found") || errString.includes("user not found") || errString.includes("account does not exist")) {
      return "Account does not exist. Please verify your email address or join our VIP Club to register.";
    }
    if (errString.includes("wrong-password") || errString.includes("wrong password")) {
      return "Incorrect password. Please verify and try again.";
    }
    if (errString.includes("invalid-credential") || errString.includes("invalid credential") || errString.includes("invalid-credentials")) {
      return "Incorrect credentials or account does not exist. Please verify and try again.";
    }
    if (errString.includes("invalid-email") || errString.includes("invalid email")) {
      return "Please enter a valid structure email address.";
    }
    if (errString.includes("weak-password") || errString.includes("weak password")) {
      return "The password is too weak. It must be at least 6 characters containing premium elements.";
    }
    if (errString.includes("user-disabled") || errString.includes("user disabled")) {
      return "This account is inactive or disabled. Please coordinate with elite support.";
    }
    if (errString.includes("too-many-requests") || errString.includes("too many requests")) {
      return "Too many unsuccessful attempts. Access has been temporarily suspended. Please try again later.";
    }
    if (errString.includes("popup-closed-by-user") || errString.includes("popup closed by user")) {
      return "Authorization window closed before completing. Please try again.";
    }
    if (errString.includes("network-request-failed") || errString.includes("network request failed")) {
      return "A network connection error occurred. Please verify your internet connection stability.";
    }
    if (errString.includes("operation-not-allowed") || errString.includes("operation not allowed")) {
      return "Authentication method is currently disabled in the workspace dashboard configurations.";
    }

    if (msg) {
      // Clean any other raw message of references to Firebase/firebase to ensure a completely pristine user feedback experience
      let sanitizedMsg = msg.replace(/firebase/gi, "Secure custom");
      // Strip any bracketed error suffixes like " (auth/invalid-credential)." or " (auth/...)" completely
      sanitizedMsg = sanitizedMsg.replace(/\s*\([\w\-/\s]+\)\.?/g, "");
      // Remove redundant "Secure custom: Error" prefix elements
      sanitizedMsg = sanitizedMsg.replace(/Secure custom:\s*Error\s*:/gi, "Error:");
      sanitizedMsg = sanitizedMsg.replace(/Secure custom:\s*Error/gi, "Error");
      sanitizedMsg = sanitizedMsg.trim();
      return sanitizedMsg;
    }

    return "An error occurred during authentication. Please check your credentials.";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          throw new Error("Full name is required to create a premium account.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        setSuccess("Magnificent! Your premium account has been created successfully.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back! Authenticated successfully.");
      }

      setTimeout(() => {
        onClose();
        // Reset forms
        setEmail("");
        setPassword("");
        setDisplayName("");
        setSuccess("");
      }, 1500);

    } catch (err: any) {
      console.error("Auth error", err);
      setError(getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess("Welcome! Authenticated via Google successfully.");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Google login failed", err);
      setError(getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBypass = async (role: "admin" | "vip") => {
    setError("");
    setSuccess("");
    setLoading(true);
    
    const targetEmail = role === "admin" ? "tosinotenaike3@gmail.com" : "vipmember@gmail.com";
    const targetPassword = role === "admin" ? "admin123456" : "member123456";
    const targetName = role === "admin" ? "Tosin Otenaike" : "Elite VIP Member";
    
    try {
      try {
        await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        setSuccess(`Successfully signed in as ${role === "admin" ? "Administrator" : "VIP Customer"}!`);
      } catch (signInErr: any) {
        const errStr = String(signInErr.code || signInErr.message || "").toLowerCase();
        if (errStr.includes("user-not-found") || errStr.includes("invalid-credential") || errStr.includes("invalid-credentials") || errStr.includes("wrong-password")) {
          if (errStr.includes("wrong-password")) {
            // Pre-fill so the user can sign in with their own password
            setEmail(targetEmail);
            setMode("signin");
            throw new Error(`The email address ${targetEmail} is already registered with a customized password. We have pre-filled it above, please enter your password to sign in.`);
          }
          // Try registration on the fly
          setSuccess(`Initializing secure ${role} credential node...`);
          try {
            const userCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            await updateProfile(userCred.user, {
              displayName: targetName
            });
            setSuccess(`Successfully registered & signed in as ${role === "admin" ? "Administrator" : "VIP Customer"}!`);
          } catch (signUpErr: any) {
            const signUpErrStr = String(signUpErr.code || signUpErr.message || "").toLowerCase();
            if (signUpErrStr.includes("already-in-use") || signUpErrStr.includes("already-exists")) {
              // Already exists in auth DB, but the login failed earlier. This means password is custom / already set!
              setEmail(targetEmail);
              setMode("signin");
              throw new Error(`This email (${targetEmail}) is already registered with a customized password. Please enter your password manually above to sign in.`);
            } else {
              throw signUpErr;
            }
          }
        } else {
          throw signInErr;
        }
      }
      
      setTimeout(() => {
        onClose();
        // Reset forms
        setEmail("");
        setPassword("");
        setDisplayName("");
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Instant bypass failed", err);
      setError(err instanceof Error ? err.message : getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#121212] border border-amber-900/30 text-white shadow-2xl overflow-hidden"
        id="luxury-auth-dialog"
      >
        {/* Decorative ambient borders */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content Area */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-[0.3em] text-amber-500 font-mono font-bold uppercase block">
              UPSIDE Gastronomy Gate
            </span>
            <h3 className="text-xl font-bold font-mono tracking-wider text-white uppercase">
              {mode === "signin" ? "EXCLUSIVE SIGN IN" : "ROYAL ACCOUNT CREATION"}
            </h3>
            <p className="text-[11px] text-neutral-400 font-sans max-w-xs mx-auto">
              {mode === "signin"
                ? "Gain access to your custom order histories, favorites drawer, and fast checkout suites."
                : "Become part of the luxury fine dining culinary club to tracks orders live and unlock rewards."}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 pb-3 text-xs tracking-widest font-mono uppercase font-bold text-center transition-all ${
                mode === "signin"
                  ? "text-amber-500 border-b-2 border-amber-500 font-bold"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 pb-3 text-xs tracking-widest font-mono uppercase font-bold text-center transition-all ${
                mode === "signup"
                  ? "text-amber-500 border-b-2 border-amber-500 font-bold"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Join Club
            </button>
          </div>

          {/* Alerts / feedback logs */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-300 text-[11px] uppercase font-mono tracking-wide leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] uppercase font-mono tracking-wide leading-relaxed">
              ⭐ {success}
            </div>
          )}

          {/* Core Auth Forms */}
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] tracking-widest text-neutral-400 font-mono uppercase block">
                  Full Access Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Tosin Otenaike"
                    className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors rounded-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] tracking-widest text-neutral-400 font-mono uppercase block">
                Email Sanctuary Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tosin@example.com"
                  className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors rounded-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] tracking-widest text-neutral-400 font-mono uppercase block">
                Select Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 premium characters"
                  className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-12 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Custom CTA Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Authenticator...</span>
                </>
              ) : mode === "signin" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>SIGN IN ONLINE</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>REGISTER TO UPSIDE CLUB</span>
                </>
              )}
            </button>
          </form>

          {/* Social Auth Option & Sandbox Instant Access */}
          <div className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-neutral-800 h-[1px] w-full" />
              <span className="relative bg-[#121212] px-3 text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
                Or authenticate premium with
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-[#181818] hover:bg-[#202020] border border-neutral-800 text-neutral-200 hover:text-white font-mono font-semibold text-[11px] tracking-wider uppercase transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
            >
              {/* Google high resolution branded logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 3C6.16 7.6 8.84 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.32 3.49l3.59 2.79c2.1-1.94 3.8-4.8 3.8-8.43z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31l-3.85-3C.56 8.44 0 10.15 0 12s.56 3.56 1.39 5.06l3.85-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.59-2.79c-1 .67-2.28 1.07-3.61 1.07-3.16 0-5.84-2.56-6.79-5.52l-3.85 3C3.37 20.35 7.35 23 12 23z"
                />
              </svg>
              <span>Authenticating with Google</span>
            </button>

            <div className="relative flex items-center justify-center pt-2">
              <div className="absolute inset-0 bg-neutral-800 h-[1px] w-full" />
              <span className="relative bg-[#121212] px-3 text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
                Sandbox Instant Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleInstantBypass("admin")}
                disabled={loading}
                className="py-2.5 px-2 bg-amber-950/25 hover:bg-amber-900/30 border border-amber-900/40 hover:border-amber-500/60 text-amber-500 text-[10px] font-mono tracking-wider uppercase transition-all duration-300 rounded cursor-pointer flex flex-col justify-center items-center gap-1 hover:shadow-lg"
              >
                <span className="font-bold">🔑 Admin Gate</span>
                <span className="text-[7.5px] text-neutral-400 font-sans tracking-tight leading-none truncate w-full">tosinotenaike3@gmail.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleInstantBypass("vip")}
                disabled={loading}
                className="py-2.5 px-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-[10px] font-mono tracking-wider uppercase transition-all duration-300 rounded cursor-pointer flex flex-col justify-center items-center gap-1 hover:shadow-lg"
              >
                <span className="font-bold">⭐ VIP Member</span>
                <span className="text-[7.5px] text-neutral-400 font-sans tracking-tight leading-none truncate w-full font-sans">vipmember@gmail.com</span>
              </button>
            </div>
          </div>

          {/* Privacy sanctuary disclaimer */}
          <div className="text-[9px] text-neutral-600 font-sans tracking-tight leading-relaxed max-w-xs mx-auto">
            🛡️ Secure connections protected under absolute zero-trust encryption rules. By authenticating, you agree to UPSIDE fine dining hospitality policies.
          </div>
        </div>
      </div>
    </div>
  );
}
