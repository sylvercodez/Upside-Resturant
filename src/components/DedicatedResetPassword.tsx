import React, { useState, useEffect } from "react";
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  ShieldAlert,
  Compass
} from "lucide-react";
import { auth } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { getApiUrl } from "../types";

interface DedicatedResetPasswordProps {
  onBackToLobby: () => void;
  onNavigate: (path: string) => void;
}

export default function DedicatedResetPassword({
  onBackToLobby,
  onNavigate
}: DedicatedResetPasswordProps) {
  // Parsing parameters from URL (query string or hash)
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [firebaseOobCode, setFirebaseOobCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Extract parameters from URL on component mount
  useEffect(() => {
    try {
      const href = window.location.href;
      
      // Parse search params from window.location.search
      const searchParams = new URLSearchParams(window.location.search);
      
      // Also parse search params inside hash (e.g. #/reset-password?token=xxx or #reset-password?token=xxx)
      let hashQuery = "";
      if (window.location.hash && window.location.hash.includes("?")) {
        hashQuery = window.location.hash.substring(window.location.hash.indexOf("?"));
      }
      const hashParams = new URLSearchParams(hashQuery);

      const parsedToken = searchParams.get("token") || hashParams.get("token") || "";
      const parsedEmail = searchParams.get("email") || hashParams.get("email") || "";
      const parsedPin = searchParams.get("pin") || hashParams.get("pin") || "";
      const parsedOobCode = searchParams.get("oobCode") || hashParams.get("oobCode") || "";

      if (parsedToken) setToken(parsedToken);
      if (parsedEmail) setEmail(decodeURIComponent(parsedEmail));
      if (parsedPin) setPin(parsedPin);
      if (parsedOobCode) setFirebaseOobCode(parsedOobCode);

      // Validate token if provided
      if (parsedOobCode) {
        verifyPasswordResetCode(auth, parsedOobCode)
          .then((fbEmail) => {
            setEmail(fbEmail);
            setTokenValid(true);
            setIsValidatingToken(false);
          })
          .catch((err) => {
            console.warn("Firebase oobCode verification failed:", err);
            setTokenValid(false);
            setTokenError("The security reset link has expired or has already been used.");
            setIsValidatingToken(false);
          });
      } else if (parsedToken || (parsedPin && parsedEmail)) {
        validateTokenOrPin(parsedToken, parsedPin, parsedEmail);
      } else {
        // No pre-filled token: user can manually enter their token/PIN and email
        setIsValidatingToken(false);
        setTokenValid(null);
      }
    } catch (e) {
      console.warn("Error reading URL reset parameters:", e);
      setIsValidatingToken(false);
    }
  }, []);

  // Validation function against backend
  const validateTokenOrPin = async (t: string, p: string, em: string) => {
    setIsValidatingToken(true);
    setTokenError("");
    try {
      const res = await fetch(getApiUrl("/api/mysql/auth/verify-reset-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t || undefined, pin: p || undefined, email: em || undefined })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setTokenValid(true);
        if (data.email) setEmail(data.email);
        if (data.token && !token) setToken(data.token);
      } else {
        setTokenValid(false);
        setTokenError(data.error || "Password reset token is invalid or has expired.");
      }
    } catch (err: any) {
      console.warn("Token verification network issue:", err);
      // Allow user to still proceed if server is unreachable
      setTokenValid(true);
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-neutral-800" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500 text-red-400" };
    if (score <= 4) return { score: 2, label: "Good", color: "bg-amber-500 text-amber-400" };
    return { score: 3, label: "Strong", color: "bg-emerald-500 text-emerald-400" };
  };

  const strength = getPasswordStrength(newPassword);

  // Form submission handler
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!email.trim()) {
      setSubmitError("Please enter your account email address.");
      return;
    }

    if (!token && !pin && !firebaseOobCode) {
      setSubmitError("Reset token or 6-digit Security PIN is required.");
      return;
    }

    if (newPassword.length < 6) {
      setSubmitError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If Firebase OOB Code is present, update Firebase password
      if (firebaseOobCode) {
        try {
          await confirmPasswordReset(auth, firebaseOobCode, newPassword);
        } catch (fbErr: any) {
          console.warn("Firebase confirmPasswordReset error:", fbErr);
        }
      }

      // 2. Update MySQL backend password
      const res = await fetch(getApiUrl("/api/mysql/auth/reset-password-with-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          pin: pin || undefined,
          email: email.trim().toLowerCase(),
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Please check your token or PIN.");
      }

      // Success
      setSubmitSuccess(true);

      // Countdown to redirect
      let count = 5;
      const timer = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          onNavigate("/auth");
        }
      }, 1000);

    } catch (err: any) {
      console.error("Reset password error:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header Controls */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-mono tracking-wider uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Back to Upside</span>
        </button>

        <button
          onClick={() => onNavigate("/auth")}
          className="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wider cursor-pointer"
        >
          Sign In Portal
        </button>
      </div>

      {/* Main Form Container */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-6">
        <div className="bg-[#121212] border border-neutral-800/80 p-6 sm:p-8 shadow-2xl relative">
          {/* Gold Accent Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-bold uppercase tracking-widest text-white">
              Reset Password
            </h1>
            <p className="text-xs font-sans text-neutral-400 mt-1">
              Create a new secure access key for your account
            </p>
          </div>

          {/* Loading Verification State */}
          {isValidatingToken && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-mono text-neutral-400 tracking-wider">
                Verifying secure reset credentials...
              </p>
            </div>
          )}

          {/* Expired / Invalid Token Banner with Manual PIN entry option */}
          {!isValidatingToken && tokenValid === false && !submitSuccess && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>Reset Token Expired or Invalid</span>
              </div>
              <p className="text-xs text-neutral-300 font-sans">
                {tokenError || "This password reset token has expired or has already been used."}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTokenValid(null);
                    setToken("");
                  }}
                  className="w-full text-center px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Enter PIN Manually
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("/auth")}
                  className="w-full text-center px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Request New Reset Email
                </button>
              </div>
            </div>
          )}

          {/* Success State Screen */}
          {submitSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Password Updated!
                </h2>
                <p className="text-xs text-neutral-300 font-sans mt-2 leading-relaxed">
                  Your account password has been reset successfully. You can now use your new credentials to log into your account.
                </p>
              </div>

              <div className="p-3 bg-neutral-900/80 border border-neutral-800 font-mono text-xs text-neutral-400">
                Auto-redirecting to login in <span className="text-amber-400 font-bold">{redirectCountdown}s</span>
              </div>

              <button
                onClick={() => onNavigate("/auth")}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Proceed to Login Now
              </button>
            </div>
          ) : (
            /* Reset Password Form */
            !isValidatingToken && (tokenValid === true || tokenValid === null) && (
              <form onSubmit={handleResetSubmit} className="space-y-4 text-left">
                {submitError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-sans flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      required
                      className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-3 py-2.5 text-xs text-white font-sans focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* If token is missing, provide PIN input */}
                {!token && !firebaseOobCode && (
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      6-Digit Security PIN or Token
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN from your email (e.g. 849201)"
                        required
                        className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-3 py-2.5 text-xs text-amber-400 font-mono tracking-widest focus:outline-hidden focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1 font-sans">
                      Check your email inbox for the 6-digit security verification PIN.
                    </p>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-10 py-2.5 text-xs text-white font-sans focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-500">Security Strength:</span>
                        <span className={`font-bold ${strength.color.split(" ")[1]}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-neutral-800 overflow-hidden flex gap-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strength.score >= 1 ? strength.color.split(" ")[0] : "bg-neutral-800"
                          } ${strength.score === 1 ? "w-1/3" : strength.score === 2 ? "w-2/3" : "w-full"}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      minLength={6}
                      className="w-full bg-[#181818] border border-neutral-800 pl-10 pr-10 py-2.5 text-xs text-white font-sans focus:outline-hidden focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[10px] text-red-400 mt-1 font-mono">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || (!!confirmPassword && newPassword !== confirmPassword)}
                  className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-black font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            )
          )}

          {/* Footer Assistance */}
          <div className="mt-6 pt-4 border-t border-neutral-850 text-center">
            <p className="text-[11px] text-neutral-500 font-sans">
              Need help? Contact concierge support or{" "}
              <button
                type="button"
                onClick={() => onNavigate("/auth")}
                className="text-amber-500 hover:underline font-mono cursor-pointer"
              >
                return to sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="text-center z-10">
        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
          Upside Restaurant &amp; Lounge &bull; Secure Identity Gateway
        </p>
      </div>
    </div>
  );
}
