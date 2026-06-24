import React, { useState, useEffect } from "react";
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, LogIn, UserPlus, ArrowLeft, CheckCircle, Compass } from "lucide-react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getApiUrl } from "../types";
import classicDrinks from "../assets/images/classic_restaurant_drinks_1782058509882.jpg";

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
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
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

  // Load SMTP status check on mount with resilient error handling and safe diagnostics
  useEffect(() => {
    fetch(getApiUrl("/api/otp/status"))
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        const text = await res.text();
        let excerpt = text.trim();
        if (excerpt.includes("<pre>")) {
          const preMatch = excerpt.match(/<pre>([\s\S]*?)<\/pre>/i);
          if (preMatch && preMatch[1]) {
            excerpt = preMatch[1].trim();
          }
        } else if (excerpt.includes("<title>")) {
          const titleMatch = excerpt.match(/<title>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            excerpt = `Page Title: ${titleMatch[1].trim()}`;
          }
        }
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200) + "...";
        }
        throw new Error(`Server returned non-JSON response (status ${res.status}). Details: ${excerpt || "No response body"}`);
      })
      .then((data) => setSmtpStatus(data))
      .catch((err) => {
        console.warn("[SMTP Status Fallback Activated] Could not load SMTP configuration status:", err.message || err);
        // Fallback to offline defaults so that authentication checks and OTP simulator is accessible
        setSmtpStatus({
          configured: false,
          host: null,
          from: null
        });
      });
  }, []);

  const [isMySQLActive, setIsMySQLActive] = useState(false);

  // Load SMTP and MySQL configured status
  useEffect(() => {
    fetch(getApiUrl("/api/mysql/status"))
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return { connected: false };
      })
      .then(data => {
        if (data && data.connected) {
          setIsMySQLActive(true);
          console.log("SQL Engine Active inside login portal.");
        } else {
          setIsMySQLActive(false);
        }
      })
      .catch((e) => {
        console.log("MySQL connection check skipped:", e.message);
        setIsMySQLActive(false);
      });
  }, []);

  const safeJson = async (res: Response, defaultErrorMsg: string): Promise<any> => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }
    const text = await res.text();
    let excerpt = text.trim();
    if (excerpt.includes("<pre>")) {
      const preMatch = excerpt.match(/<pre>([\s\S]*?)<\/pre>/i);
      if (preMatch && preMatch[1]) {
        excerpt = preMatch[1].trim();
      }
    } else if (excerpt.includes("<title>")) {
      const titleMatch = excerpt.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        excerpt = `Page Title: ${titleMatch[1].trim()}`;
      }
    }
    if (excerpt.length > 250) {
      excerpt = excerpt.substring(0, 250) + "...";
    }
    throw new Error(`Server returned non-JSON error (status ${res.status}). Details: ${excerpt || defaultErrorMsg}`);
  };

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
    if (!err) return "An unknown authentication error occurred. Please try again.";
    
    // Extract code and message from various possible error formats
    const code = err?.code || "";
    let msg = err?.message || (typeof err === "string" ? err : "");
    const errString = `${code} ${msg}`.toLowerCase();
    
    if (errString.includes("email-already-in-use") || errString.includes("email already in use")) {
      return "This email address is already registered with Upside. Please select 'Sign In' instead of 'Sign Up' or use 'Forgot Password' if you cannot recall your credentials.";
    }
    if (errString.includes("user-not-found") || errString.includes("user not found") || errString.includes("account does not exist")) {
      return "Account does not exist. Please verify your email address or select 'Sign Up' to register.";
    }
    if (errString.includes("wrong-password") || errString.includes("wrong password")) {
      return "Incorrect password. Please verify and try again.";
    }
    if (errString.includes("invalid-credential") || errString.includes("invalid credential") || errString.includes("invalid-credentials")) {
      return "Incorrect credentials or account does not exist. Please verify and try again.";
    }
    if (errString.includes("invalid-email") || errString.includes("invalid email")) {
      return "Please enter a valid email address structure (e.g., mail@example.com).";
    }
    if (errString.includes("weak-password") || errString.includes("weak password")) {
      return "The password is too weak. It must be at least 6 characters.";
    }
    if (errString.includes("user-disabled") || errString.includes("user disabled")) {
      return "This account is inactive or disabled. Please coordinate with support.";
    }
    if (errString.includes("too-many-requests") || errString.includes("too many requests")) {
      return "Too many unsuccessful attempts. Access has been temporarily suspended. Please try again later or recover your credentials.";
    }
    if (errString.includes("popup-closed-by-user") || errString.includes("popup closed by user")) {
      return "Authorization window closed before completing. Please try again.";
    }
    if (errString.includes("network-request-failed") || errString.includes("network request failed")) {
      return "A network connection error occurred. Please verify your internet connection stability.";
    }
    if (errString.includes("operation-not-allowed") || errString.includes("operation not allowed") || errString.includes("identitytoolkit.googleapis.com") || errString.includes("identity toolkit")) {
      return "Authentication Setup Missing: The 'Email/Password' authentication provider has not been enabled in your Firebase project, or the 'Identity Toolkit API' is disabled in your Google Cloud Developer Console. Action: 1. Go to Firebase Console > Authentication > Sign-in method, click 'Email/Password' and enable it. 2. Ensure Google Cloud Identity Toolkit API is enabled.";
    }
    if (errString.includes("unauthorized-domain") || errString.includes("unauthorized domain")) {
      return "Unauthorized Domain: The domain '" + window.location.hostname + "' has not been added to your Firebase project. Action: Go to Firebase Console > Authentication > Settings and add '" + window.location.hostname + "' to the list of 'Authorized domains'.";
    }
    if (errString.includes("api-key-not-valid") || errString.includes("invalid api-key") || errString.includes("api key is invalid")) {
      return "Configuration Error [auth/invalid-api-key]: The Firebase API key utilized is invalid or restricted. Please double check your firebase-applet-config.json and ensure your API key does not have domain restrictions that exclude your domain '" + window.location.hostname + "'.";
    }

    // Fallback error renderer with clear debug information
    const displayCode = code ? `[${code}] ` : "";
    let cleanMsg = msg || "An error occurred during authentication. Please contact system administration.";
    
    // Clean up internal Firebase prefixes
    cleanMsg = cleanMsg.replace(/firebase/gi, "Firebase");
    cleanMsg = cleanMsg.replace(/\s*\([\w\-/\s]+\)\.?/g, ""); // strip duplicate bracketed code from the end of message

    return `${displayCode}${cleanMsg.trim()}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Email sanctuary address is required to dispatch the passkey reset.");
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Success! A secure credential recovery link has been dispatched to your email address. Please follow the instructions to reset your password.");
      } catch (err: any) {
        console.error("Password reset dispatch failed", err);
        setError(getCleanAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    const isSpecialBypass = email.toLowerCase().trim() === "mophethecommerce3@gmail.com" && password === "1234";
    const mappedPassword = isSpecialBypass ? "mophethecommerce3_secure_1234" : password;

    if (mode === "signup" && !displayName.trim()) {
      setError("Full name is required to create an account.");
      return;
    }
    if (mappedPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isSpecialBypass) {
        // Special admin bypass registration/login handler
        if (isMySQLActive) {
          try {
            const signupRes = await fetch(getApiUrl("/api/mysql/auth/social-sync"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                uid: "bypass-admin-mopheth3", 
                email: email.toLowerCase().trim(), 
                displayName: "Mopheth Admin 3" 
              })
            });
            const sData = await safeJson(signupRes, "Bypass registration failed.");
            if (signupRes.ok) {
              localStorage.setItem("upside_mysql_user", JSON.stringify({ ...sData.user, role: "admin" }));
              window.dispatchEvent(new Event("mysql-login"));
            }
          } catch(e) {
            console.warn("MySQL bypass failure:", e);
          }
        }

        // Firebase Auth bypass flow (Register if not exist, otherwise Sign In)
        try {
          await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), mappedPassword);
        } catch (authErr: any) {
          const code = authErr.code || "";
          if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
            try {
              const uCred = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), mappedPassword);
              await updateProfile(uCred.user, { displayName: "Mopheth Admin 3" });
            } catch (createErr) {
              console.error("Fidelity bypass registration fault:", createErr);
            }
          } else {
            throw authErr;
          }
        }

        // Make sure user role is set to admin in Firestore
        try {
          if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
              uid: auth.currentUser.uid,
              email: email.toLowerCase().trim(),
              displayName: "Mopheth Admin 3",
              role: "admin",
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn("Firestore user profile bootstrap skipped:", dbErr);
        }

        setSuccess("Welcome back, Chief Admin! Secure login bypassed successfully without OTP. Redirecting...");
        setTimeout(() => {
          onNavigate("/dashboard");
          setEmail("");
          setPassword("");
          setDisplayName("");
          setIsVerifyingOtp(false);
          setOtpCode("");
          setOtpDemoCode("");
          setSmtpSendError(null);
          setSuccess("");
        }, 1200);
        return;
      }

      if (isMySQLActive) {
        if (mode === "signin") {
          try {
            const authCheck = await fetch(getApiUrl("/api/mysql/auth/login"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password: mappedPassword })
            });
            const checkData = await safeJson(authCheck, "Incorrect email or password combination.");
            if (!authCheck.ok) {
              throw new Error(checkData.error || "Incorrect email or password combination.");
            }
          } catch (err: any) {
            throw new Error(err.message || "MySQL account verification failed. Please try again.");
          }
        }
      } else {
        if (mode === "signin") {
          try {
            const userCred = await signInWithEmailAndPassword(auth, email, mappedPassword);
            await auth.signOut();
          } catch (authErr: any) {
            console.error("Credentials verification failed before OTP:", authErr);
            throw new Error(getCleanAuthError(authErr));
          }
        }
      }

      // Trigger secure OTP routing to verify the user owns the email address
      const res = await fetch(getApiUrl("/api/otp/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: email })
      });
      
      const data = await safeJson(res, "Failed to trigger verification code dispatcher.");
      
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
      const res = await fetch(getApiUrl("/api/otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: email, code: otpCode })
      });
      
      const data = await safeJson(res, "The inputted 6-digit OTP code is incorrect. Try again.");
      
      if (!res.ok) {
        throw new Error(data.error || "The inputted 6-digit OTP code is incorrect. Try again.");
      }

      setSuccess("OTP validated successfully! Establishing secure credential session...");

      // Finalize authenticating actual user session in Firebase or MySQL based on engine mode
      if (isMySQLActive) {
        if (mode === "signup") {
          const sRes = await fetch(getApiUrl("/api/mysql/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName })
          });
          const sData = await safeJson(sRes, "Failed registration inside cPanel MySQL Database.");
          if (!sRes.ok) {
            throw new Error(sData.error || "Failed registration inside cPanel MySQL Database.");
          }
          localStorage.setItem("upside_mysql_user", JSON.stringify(sData.user));
          window.dispatchEvent(new Event("mysql-login"));
          setSuccess("Magnificent! Your account has been registered successfully in local MySQL!");
        } else {
          const lRes = await fetch(getApiUrl("/api/mysql/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          const lData = await safeJson(lRes, "Authentication failed inside cPanel MySQL Database.");
          if (!lRes.ok) {
            throw new Error(lData.error || "Authentication failed inside cPanel MySQL Database.");
          }
          localStorage.setItem("upside_mysql_user", JSON.stringify(lData.user));
          window.dispatchEvent(new Event("mysql-login"));
          setSuccess("Welcome back! Authenticated successfully in local MySQL Database.");
        }
      } else {
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user || !user.email) {
        throw new Error("Could not retrieve email address from your Google Account credentials.");
      }

      if (isMySQLActive) {
        setSuccess("Syncing Google login profile with central cloud database...");
        const syncRes = await fetch(getApiUrl("/api/mysql/auth/social-sync"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName 
          })
        });
        
        const syncData = await safeJson(syncRes, "Could not register details in primary SQL store.");
        if (!syncRes.ok) {
          // If deactivated or sync fails, sign out from Firebase
          await auth.signOut();
          throw new Error(syncData.error || "Could not register details in primary SQL store.");
        }

        localStorage.setItem("upside_mysql_user", JSON.stringify(syncData.user));
        window.dispatchEvent(new Event("mysql-login"));
      }

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
      setError(err?.code ? getCleanAuthError(err) : (err?.message || String(err)));
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
              backgroundImage: `url(${classicDrinks})` 
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
                  {mode === "signin" ? "SIGN IN" : mode === "signup" ? "CREATE AN ACCOUNT" : "FORGOT PASSWORD"}
                </h3>
                <p className="text-[11px] text-neutral-500 font-sans leading-normal animate-fadeIn">
                  {isVerifyingOtp
                    ? `A security PIN check is required. Enter the 6-digit confirmation code sent to ${email} to authorize.`
                    : mode === "forgot"
                    ? "Enter your registered email address and we'll dispatch a link to securely reset your credentials."
                    : mode === "signin"
                    ? "Gain access to your custom order histories, favorites drawer, and fast checkout suites."
                    : "Register with Upside to track current orders in real-time, view your order histories, and expedite checkouts."}
                </p>
              </div>

              {/* Alerts / Feedback Log messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-sans font-medium leading-relaxed animate-fadeIn text-left">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 text-xs font-sans font-medium leading-relaxed animate-fadeIn text-left">
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

                  {/* Dynamic Luxury Real-time SMTP Dispatch Warn Box */}
                  {smtpSendError && (
                    <div className="p-2.5 bg-neutral-900/95 border border-amber-500/20 text-left font-sans text-xs">
                      <div className="flex items-center gap-1.5 text-[9px] text-amber-500 uppercase tracking-widest font-bold mb-1 font-mono">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Verification System Notice
                      </div>
                      <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                        Notice: <span className="text-neutral-300 font-semibold">{smtpSendError}</span> Since direct email dispatch has been bypassed, we have provided an instant simulator passcode above. Please use this temporary code to sign in and proceed seamlessly.
                      </p>
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
                  {mode !== "forgot" && (
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
                  )}

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

                    {mode !== "forgot" && (
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] tracking-widest text-neutral-550 font-mono uppercase block text-neutral-500">
                            Select Password
                          </label>
                          {mode === "signin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode("forgot");
                                setError("");
                                setSuccess("");
                              }}
                              className="text-[10px] font-mono tracking-wider text-amber-600 hover:text-amber-500 hover:underline cursor-pointer"
                            >
                              Forgot Password?
                            </button>
                          )}
                        </div>
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
                    )}

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
                      ) : mode === "forgot" ? (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>SEND RESET EMAIL</span>
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

                    {mode === "forgot" && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signin");
                            setError("");
                            setSuccess("");
                          }}
                          className="text-[11px] font-mono uppercase tracking-wider text-amber-600 hover:underline hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          Cancel and Return to Sign In
                        </button>
                      </div>
                    )}
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

                {/* Secure Courier & Rider Access Redirector */}
                <div className="pt-4 border-t border-dotted border-neutral-200 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">Are you an authorized Courier?</span>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("/rider")}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-[11px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-amber-600"
                    id="rider-portal-redirect-btn"
                  >
                    <Compass className="w-4 h-4 text-white animate-spin" style={{ animationDuration: "15s" }} />
                    <span>Go to Rider Login Portal</span>
                  </button>
                </div>

                {/* Privacy policy statement */}
                <div className="text-[9.5px] text-neutral-500 font-sans tracking-tight leading-relaxed max-w-xs mx-auto text-center pt-2">
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
