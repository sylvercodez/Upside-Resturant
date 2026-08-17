import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw,
  Send,
  ShoppingBag,
  Clock,
  LogOut
} from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { updateCurrentUserName, updateCurrentUserPassword, sendUserPasswordResetEmail } from "../utils/userManagement";

interface UserProfilePanelProps {
  currentUser: FirebaseUser | any;
  userRole: string;
  userProfileData?: any;
  onProfileUpdated?: (updatedData: { displayName: string }) => void;
  onNavigateToTab?: (tabId: string) => void;
  onLogout?: () => void;
}

export default function UserProfilePanel({
  currentUser,
  userRole,
  userProfileData,
  onProfileUpdated,
  onNavigateToTab,
  onLogout
}: UserProfilePanelProps) {
  // Name Edit State
  const initialName = currentUser?.displayName || userProfileData?.displayName || currentUser?.email?.split("@")[0] || "";
  const [displayName, setDisplayName] = useState(initialName);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reset Email State
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    } else if (userProfileData?.displayName) {
      setDisplayName(userProfileData.displayName);
    }
  }, [currentUser?.displayName, userProfileData?.displayName]);

  // Check if provider is Google
  const isGoogleProvider = currentUser?.providerData?.some(
    (p: any) => p.providerId === "google.com"
  ) || currentUser?.uid?.startsWith("google_");

  const email = currentUser?.email || userProfileData?.email || "No email associated";

  // Handle Name Update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");

    if (!displayName.trim() || displayName.trim().length < 2) {
      setNameError("Full name must contain at least 2 characters.");
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateCurrentUserName(displayName, currentUser);
      setNameSuccess("Profile name updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated({ displayName: displayName.trim() });
      }
      setTimeout(() => setNameSuccess(""), 5000);
    } catch (err: any) {
      setNameError(err.message || "Failed to update profile name.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters in length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateCurrentUserPassword(currentPassword, newPassword);
      setPasswordSuccess("Password successfully changed! Your account is now secured with your new passkey.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 6000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password. Please verify your current credentials.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Send Password Reset Link
  const handleSendResetLink = async () => {
    if (!currentUser?.email) return;
    setIsSendingReset(true);
    setResetSentSuccess("");
    setResetError("");
    try {
      await sendUserPasswordResetEmail(currentUser.email);
      setResetSentSuccess(`Password reset instructions have been sent to ${currentUser.email}.`);
      setTimeout(() => setResetSentSuccess(""), 7000);
    } catch (err: any) {
      setResetError(err.message || "Could not send reset link. Please try again.");
    } finally {
      setIsSendingReset(false);
    }
  };

  // Human readable role label
  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return { label: "System Administrator", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: "👑" };
      case "sales":
        return { label: "Sales & Operations", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "💼" };
      case "chef":
        return { label: "Master Kitchen Chef", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: "👨‍🍳" };
      case "menu_lister":
        return { label: "Menu Lister & Curator", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: "🍜" };
      case "rider":
        return { label: "Logistics Dispatch Rider", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: "🚴" };
      case "developer":
        return { label: "Lead Developer", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", icon: "💻" };
      default:
        return { label: "Registered VIP Member", color: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20", icon: "🍽️" };
    }
  };

  const roleInfo = getRoleLabel(userRole);
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 max-w-5xl mx-auto" id="user-profile-panel">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-500 text-xs font-mono tracking-widest uppercase font-bold">Account Security &amp; Identity</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
            My Profile &amp; Settings
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Manage your personal profile name, password, and security preferences.
          </p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-red-950/40 text-neutral-300 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            id="profile-signout-button"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Hero Overview Card */}
      <div className="bg-neutral-900/80 border border-neutral-800 p-6 sm:p-8 rounded-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          {/* Avatar Initials */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center text-2xl sm:text-3xl font-black tracking-widest uppercase shadow-xl border-2 border-amber-400/40">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
              Active
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                {displayName || "Valued Member"}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono uppercase tracking-wider font-semibold ${roleInfo.color}`}>
                <span>{roleInfo.icon}</span>
                <span>{roleInfo.label}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-neutral-500" />
                <span className="truncate max-w-[150px] sm:max-w-xs">UID: {currentUser?.uid || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          {onNavigateToTab && (
            <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-800 md:pl-6">
              <button
                onClick={() => onNavigateToTab("orders")}
                className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => onNavigateToTab("tracker")}
                className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Tracker</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Name & Email on Left / Password & Security on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Personal Profile & Locked Email */}
        <div className="space-y-6">
          
          {/* Section: Edit Full Name */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-none space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <User className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                Personal Information
              </h3>
            </div>

            {nameSuccess && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{nameSuccess}</span>
              </div>
            )}

            {nameError && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Full Display Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Adewale Johnson"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-sm font-sans transition-colors rounded-none placeholder-neutral-600"
                  required
                  id="profile-display-name-input"
                />
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                  This name is displayed on your order receipts, dining reservations, and team communications.
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingName}
                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                id="profile-save-name-btn"
              >
                {isUpdatingName ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Name...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Full Name</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Locked Email Address (Strictly Read-Only) */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                  Registered Email Address
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Locked</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Primary Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 text-neutral-400 text-sm font-mono cursor-not-allowed select-none rounded-none pr-10"
                  id="profile-locked-email-input"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Strict Notice Box explaining why email cannot be modified */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Security Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/80">
                To safeguard your transaction histories, receipts, order fulfillment, and multi-factor identity, the registered email address is permanent and cannot be modified.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Password & Authentication Credentials */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-none space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                Password &amp; Access Key
              </h3>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {resetSentSuccess && (
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2 font-mono">
                <Send className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{resetSentSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {isGoogleProvider ? (
              <div className="p-4 bg-neutral-950 border border-neutral-800 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Google Single Sign-On</span>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed font-sans">
                  Your account is secured via Google Authentication. Password changes are managed directly within your Google Account settings.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={isSendingReset}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                  >
                    {isSendingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Establish Direct Email Password</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-sm font-sans rounded-none pr-10 placeholder-neutral-600"
                      id="profile-current-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    New Password (Min 6 Characters) <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create new secure password"
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-sm font-sans rounded-none pr-10 placeholder-neutral-600"
                      required
                      minLength={6}
                      id="profile-new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Confirm New Password <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-sm font-sans rounded-none pr-10 placeholder-neutral-600"
                      required
                      minLength={6}
                      id="profile-confirm-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="profile-update-password-btn"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={isSendingReset}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Send an email link if you forgot your password"
                    id="profile-send-reset-btn"
                  >
                    {isSendingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Email Reset Link</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
