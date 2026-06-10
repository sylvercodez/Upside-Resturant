import React, { useState, useEffect } from "react";
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, LogIn, UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface DedicatedAuthProps {
  currentUser: FirebaseUser | null;
  onBackToLobby: () => void;
  onNavigate: (path: string) => void;
}

export default function DedicatedAuth({ 
  currentUser, 
  onBackToLobby,
  onNavigate
}: DedicatedAuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Integrated OTP verification engine state variables
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDemoCode, setOtpDemoCode] = useState("");
  const [smtpSendError, setSmtpSendError] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host: string | null; from: string | null } | null>(null);

  // Load SMTP status check on mount
  useEffect(() => {
    fetch("/api/otp/status")
      .then((res) => res.json())
      .then((data) => setSmtpStatus(data))
      .catch((err) => console.warn("Could not load SMTP configuration status:", err));
  }, []);

  // Automatically redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        onNavigate("/dashboard");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, onNavigate]);

  const getCleanAuthError = (err: any): string => {
    const code = err?.code;
    let msg = err?.message || "";
    const errString = `${code || ""} ${msg}`.toLowerCase();
    
    if (errString.includes("email-already-in-use") || errString.includes("email already in use")) {
      return "This email address is already registered. Please proceed with logging in instead.";
    }
    if (errString.includes("user-not-found") || errString.includes("user not found") || errString.includes("account does not exist")) {
      return "Account does not exist. Please verify your email address or select Sign Up to register.";
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
      return "The password is too weak. It must be at least 6 characters.";
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
      let sanitizedMsg = msg.replace(/firebase/gi, "Secure custom");
      sanitizedMsg = sanitizedMsg.replace(/\s*\([\w\-/\s]+\)\.?/g, "");
      sanitizedMsg = sanitizedMsg.replace(/Secure custom:\s*Error\s*:/gi, "Error:");
      sanitizedMsg = sanitizedMsg.replace(/Secure custom:\s*Error/gi, "Error");
      return sanitizedMsg.trim();
    }

    return "An error occurred during authentication. Please check your credentials.";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "signup" && !displayName.trim()) {
      setError("Full name is required to create an account.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          await auth.signOut();
        } catch (authErr: any) {
          console.error("Credentials verification failed before OTP:", authErr);
          throw new Error(getCleanAuthError(authErr));
        }
      }

      // Trigger secure OTP routing to verify the user owns the email address
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger verification code dispatcher.");
      }

      setIsVerifyingOtp(true);
      if (data.demoCode) {
        setOtpDemoCode(data.demoCode);
      }
      if (data.smtpError) {
        setSmtpSendError(data.smtpError);
      } else {
        setSmtpSendError(null);
      }
      setSuccess(data.message || `Verification PIN successfully routed to ${email}. Confirm ownership to authorize session.`);
    } catch (err: any) {
      console.error("Initiate OTP check failed", err);
      setError(err?.message || "An exception occurred during dispatch routing.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerifyConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Kindly enter the complete 6-digit security PIN.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: email, code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "The inputted 6-digit OTP code is incorrect. Try again.");
      }

      setSuccess("OTP validated successfully! Establishing secure credential session...");

      // Finalize authenticating actual user session in Firebase
      if (mode === "signup") {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, {
            displayName: displayName
          });
          
          // Sync record
          try {
            const userRef = doc(db, "users", userCredential.user.uid);
            await setDoc(userRef, {
              uid: userCredential.user.uid,
              email: email,
              displayName: displayName,
              role: "user",
              createdAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn("DB write failed in background:", dbErr);
          }
          setSuccess("Magnificent! Your premium account has been created successfully!");
        } catch (signupErr: any) {
          if (signupErr.code === "auth/email-already-in-use") {
            try {
              await signInWithEmailAndPassword(auth, email, password);
              setSuccess("Account already exists. Welcome back! Authenticated successfully.");
            } catch (signInErr: any) {
              console.error("Auto sign-in after already-in-use failed:", signInErr);
              throw new Error("This email is already registered. If it is your account, please check the password and try again.");
            }
          } else {
            throw signupErr;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back! Authenticated successfully.");
      }

      setTimeout(() => {
        onNavigate("/dashboard");
        // Reset state
        setEmail("");
        setPassword("");
        setDisplayName("");
        setIsVerifyingOtp(false);
        setOtpCode("");
        setOtpDemoCode("");
        setSmtpSendError(null);
        setSuccess("");
      }, 1500);

    } catch (err: any) {
      console.error("Firebase Auth Confirmation Failure", err);
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
        onNavigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Google login failed", err);
      setError(getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBypass = async (role: "admin" | "chef" | "user") => {
    setError("");
    setSuccess("");
    setLoading(true);
    
    let targetEmail = "";
    let targetPassword = "";
    let targetName = "";
    
    if (role === "admin") {
      targetEmail = "tosinotenaike3@gmail.com";
      targetPassword = "admin123456";
      targetName = "Tosin Otenaike";
    } else if (role === "chef") {
      targetEmail = "chefmonitor@gmail.com";
      targetPassword = "chef123456";
      targetName = "Master Chef Executive";
    } else {
      targetEmail = "democlient@gmail.com";
      targetPassword = "client123456";
      targetName = "Lobby Demo Client";
    }
    
    try {
      try {
        const userCred = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        // Sync/verify role database node
        try {
          const userRef = doc(db, "users", userCred.user.uid);
          await setDoc(userRef, {
            uid: userCred.user.uid,
            email: targetEmail,
            displayName: targetName,
            role: role,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Could not sync sandbox role on sign-in:", dbErr);
        }
        setSuccess(`Successfully signed in as ${role === "admin" ? "Administrator" : role === "chef" ? "Master Chef" : "Demo Client"}!`);
      } catch (signInErr: any) {
        const errStr = String(signInErr.code || signInErr.message || "").toLowerCase();
        if (errStr.includes("user-not-found") || errStr.includes("invalid-credential") || errStr.includes("invalid-credentials") || errStr.includes("wrong-password")) {
          if (errStr.includes("wrong-password")) {
            setEmail(targetEmail);
            setMode("signin");
            throw new Error(`The email address ${targetEmail} is already registered with a customized password. Please enter your password manually.`);
          }
          setSuccess(`Initializing secure ${role} credential node...`);
          try {
            const userCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            await updateProfile(userCred.user, {
              displayName: targetName
            });
            // Sync role to database
            try {
              const userRef = doc(db, "users", userCred.user.uid);
              await setDoc(userRef, {
                uid: userCred.user.uid,
                email: targetEmail,
                displayName: targetName,
                role: role,
                createdAt: new Date().toISOString()
              });
            } catch (dbErr) {
              console.warn("Could not write sandbox role to Firestore:", dbErr);
            }
            setSuccess(`Successfully registered & signed in as ${role === "admin" ? "Administrator" : role === "chef" ? "Master Chef" : "Demo Client"}!`);
          } catch (signUpErr: any) {
            const signUpErrStr = String(signUpErr.code || signUpErr.message || "").toLowerCase();
            if (signUpErrStr.includes("already-in-use") || signUpErrStr.includes("already-exists")) {
              setEmail(targetEmail);
              setMode("signin");
              throw new Error(`This email (${targetEmail}) is already registered. Please enter your password manually.`);
            } else {
              throw signUpErr;
            }
          }
        } else {
          throw signInErr;
        }
      }
      
      setTimeout(() => {
        onNavigate("/dashboard");
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

  // Render Already Logged In gateway routing
  if (currentUser) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 bg-neutral-50 text-neutral-900">
        <div className="w-full max-w-md p-8 bg-white border border-neutral-200 text-center space-y-6 shadow-xl relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
          <CheckCircle className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-neutral-900">
              Already Signed In
            </h3>
            <p className="text-xs text-neutral-500 leading-normal">
              You are currently logged in as <strong className="text-neutral-800">{currentUser.displayName || currentUser.email}</strong>. Routing your private culinary catalog dashboard...
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate("/dashboard")}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-mono uppercase font-black text-xs tracking-widest transition-colors cursor-pointer"
            >
              Access Dashboard
            </button>
            <button
              onClick={onBackToLobby}
              className="w-full py-3 bg-white border border-neutral-200 hover:border-amber-500 text-neutral-600 hover:text-neutral-900 font-mono uppercase font-bold text-xs tracking-widest transition-all cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] py-12 md:py-16 flex items-center justify-center px-4 md:px-8 bg-white text-neutral-900 relative">
      {/* Decorative top soft warm sand accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-neutral-100" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-center">
        
        {/* Brand visual aesthetic column with interactive high-resolution culinary photography */}
        <div className="md:col-span-5 relative h-[640px] hidden md:flex flex-col justify-between p-8 overflow-hidden group border border-neutral-200 shadow-md">
          {/* Main Background Image of Artisanal Gastronomy Plating */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out group-hover:scale-105"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200')` 
            }}
          />
          {/* Rich Premium Overlay Gradients for absolute legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top Back Nav Button with elegant blur white container */}
            <div>
              <button
                onClick={onBackToLobby}
                className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#f3f4f6] hover:text-amber-400 transition-colors group cursor-pointer bg-black/40 backdrop-blur-md px-3.5 py-2 border border-white/10"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Lobby</span>
              </button>
            </div>

            {/* Bottom Brand Context info */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono tracking-[0.2em] font-bold text-[9px] uppercase">
                  <span>UPSIDE FINE DINING</span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold font-sans tracking-tight text-white leading-tight">
                  A Culinary Sanctuary Designed Around Your Taste.
                </h1>
                <p className="text-[11px] leading-relaxed text-neutral-300 font-sans">
                  Authenticate your identity securely to manage fine dining banquets, customize gastronomic journeys, and track curated hand-delivered items in real-time.
                </p>
              </div>

              {/* Minimalist Policy highlights */}
              <div className="p-4 bg-black/60 backdrop-blur-md border border-neutral-800 space-y-1.5">
                <span className="text-[8.5px] uppercase tracking-widest text-amber-400 font-mono font-bold block">🛡️ Multi-Factor Dispatch Verification</span>
                <p className="text-[9.5px] text-neutral-300 leading-normal font-sans">
                  We generate a secure, single-use email verification passcode to assure high-grade session security and prevent unauthorized credential changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic form login controls column - Beautiful Light theme Card */}
        <div className="md:col-span-7">
          <div className="w-full max-w-md mx-auto bg-white border border-neutral-200 text-neutral-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />
            
            {/* Header Area */}
            <div className="p-6 sm:p-8 pb-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] tracking-[0.25em] text-amber-600 font-mono font-bold uppercase block">
                  Upside Secure Authorization
                </span>
                <button
                  onClick={onBackToLobby}
                  className="md:hidden inline-flex items-center gap-1 text-[10px] uppercase font-mono text-neutral-500 hover:text-amber-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-xl font-bold font-mono tracking-wider text-neutral-955 uppercase animate-fadeIn">
                  {mode === "signin" ? "SIGN IN" : "CREATE AN ACCOUNT"}
                </h3>
                <p className="text-[11px] text-neutral-500 font-sans leading-normal animate-fadeIn">
                  {isVerifyingOtp
                    ? `A security PIN check is required. Enter the 6-digit confirmation code sent to ${email} to authorize.`
                    : mode === "signin"
                    ? "Gain access to your custom order histories, favorites drawer, and fast checkout suites."
                    : "Register with Upside to track current orders in real-time, view your order histories, and expedite checkouts."}
                </p>
              </div>

              {/* Alerts / Feedback Log messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] uppercase font-mono tracking-wide leading-relaxed animate-fadeIn text-left">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] uppercase font-mono tracking-wide leading-relaxed animate-fadeIn text-left">
                  ⭐ {success}
                </div>
              )}

              {/* OTP Verifier Panel Mode */}
              {isVerifyingOtp ? (
                <div className="space-y-4 animate-fadeIn pt-2">
                  {/* Non-intrusive Dev Simulation Passcode line */}
                  {otpDemoCode && (
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/60 text-center font-mono">
                      <span className="text-[10px] text-[#78350f] uppercase tracking-wider font-bold">Simulator Code: </span>
                      <span className="text-[13px] font-bold text-neutral-900 font-mono select-all ml-1 bg-amber-50 px-2.5 py-0.5 border border-amber-200">{otpDemoCode}</span>
                    </div>
                  )}

                  <form onSubmit={handleOtpVerifyConfirm} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-widest text-amber-600 font-mono uppercase block">
                        Enter 6-Digit security Code
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 animate-pulse" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="e.g. 142953"
                          className="w-full bg-neutral-50 border border-neutral-300 pl-10 pr-4 py-3 text-sm text-center font-bold tracking-[0.6em] text-neutral-900 focus:outline-none focus:bg-white focus:border-amber-500 transition-all rounded-none font-mono placeholder-neutral-400"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1.5 font-mono">
                        <span>Target: {email}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsVerifyingOtp(false);
                            setOtpCode("");
                            setOtpDemoCode("");
                            setSmtpSendError(null);
                            setError("");
                            setSuccess("");
                          }}
                          className="text-amber-600 hover:underline cursor-pointer font-bold"
                        >
                          Change Details
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-[#f3f4f6] disabled:text-neutral-400 text-black font-mono font-black text-xs tracking-widest uppercase transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Validating Security PIN...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>VERIFY &amp; ESTABLISH SESSION</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="pt-2">
                  {/* Tab Option Selection with clean grey borders */}
                  <div className="flex border-b border-neutral-200 mb-6">
                    <button
                      onClick={() => {
                        setMode("signin");
                        setError("");
                      }}
                      className={`flex-1 pb-3 text-[11px] tracking-widest font-mono uppercase font-bold text-center transition-all cursor-pointer ${
                        mode === "signin"
                          ? "text-amber-500 border-b-2 border-amber-500 font-bold"
                          : "text-neutral-400 hover:text-neutral-600"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className={`flex-1 pb-3 text-[11px] tracking-widest font-mono uppercase font-bold text-center transition-all cursor-pointer ${
                        mode === "signup"
                          ? "text-amber-500 border-b-2 border-amber-500 font-bold"
                          : "text-neutral-400 hover:text-neutral-600"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] tracking-widest text-neutral-550 font-mono uppercase block text-neutral-500">
                          Full Access Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Tosin Otenaike"
                            className="w-full bg-neutral-50 hover:bg-neutral-50/50 border border-neutral-300 pl-10 pr-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors rounded-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-widest text-neutral-550 font-mono uppercase block text-neutral-500">
                        Email Sanctuary Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. tosin@example.com"
                          className="w-full bg-neutral-50 hover:bg-neutral-50/50 border border-neutral-300 pl-10 pr-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors rounded-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-widest text-neutral-550 font-mono uppercase block text-neutral-500">
                        Select Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 6 premium characters"
                          className="w-full bg-neutral-50 hover:bg-neutral-50/50 border border-neutral-300 pl-10 pr-12 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors rounded-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Custom CTA Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching verification...</span>
                        </>
                      ) : mode === "signin" ? (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>SIGN IN ONLINE</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>CREATE AN ACCOUNT</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Social Oauth / Bypasses section */}
            {!isVerifyingOtp && (
              <div className="p-6 sm:p-8 pt-2 space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-x-0 bg-neutral-200 h-[1.5px] w-full" />
                  <span className="relative bg-white px-3 text-[10px] tracking-widest font-mono text-neutral-400 uppercase">
                    Or sign in with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 font-mono font-semibold text-[11px] tracking-wider uppercase transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                >
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
                  <div className="absolute inset-x-0 bg-neutral-200 h-[1.5px] w-full" />
                  <span className="relative bg-white px-3 text-[10px] tracking-widest font-mono text-neutral-400 uppercase">
                    Sandbox Instant Access
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleInstantBypass("admin")}
                    disabled={loading}
                    className="py-2 px-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-800 text-[10px] font-mono tracking-wider uppercase transition-all duration-300 rounded cursor-pointer flex flex-col justify-center items-center gap-1 hover:shadow-sm"
                  >
                    <span className="font-bold">🔑 Admin</span>
                    <span className="text-[7px] text-neutral-500 font-mono tracking-tight leading-none truncate w-full">tosinotenaike3...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstantBypass("chef")}
                    disabled={loading}
                    className="py-2 px-1.5 bg-[#fff7ed] hover:bg-[#ffedd5]/70 border border-[#fed7aa] text-[#9a3412] text-[10px] font-mono tracking-wider uppercase transition-all duration-300 rounded cursor-pointer flex flex-col justify-center items-center gap-1 hover:shadow-sm"
                  >
                    <span className="font-bold">🍳 Chef</span>
                    <span className="text-[7px] text-neutral-500 font-mono tracking-tight leading-none truncate w-full">chefmonitor...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstantBypass("user")}
                    disabled={loading}
                    className="py-2 px-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-mono tracking-wider uppercase transition-all duration-300 rounded cursor-pointer flex flex-col justify-center items-center gap-1 hover:shadow-sm"
                  >
                    <span className="font-bold">👤 Client</span>
                    <span className="text-[7px] text-neutral-500 font-mono tracking-tight leading-none truncate w-full">democlient...</span>
                  </button>
                </div>

                {/* Privacy policy statement */}
                <div className="text-[9.5px] text-neutral-500 font-sans tracking-tight leading-relaxed max-w-xs mx-auto text-center">
                  🛡️ Secure connections protected under absolute zero-trust encryption rules. By authenticating, you agree to UPSIDE fine dining hospitality policies.
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
