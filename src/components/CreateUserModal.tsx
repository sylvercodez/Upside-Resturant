import React, { useState } from "react";
import { 
  UserPlus, 
  X, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sliders, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  adminCreateUser, 
  CreateUserData 
} from "../utils/userManagement";
import { 
  PERMISSION_CATEGORIES, 
  ROLE_DEFAULT_PERMISSIONS 
} from "./DedicatedDashboard";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: any) => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated
}: CreateUserModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("sales");
  const [permissions, setPermissions] = useState<string[]>(ROLE_DEFAULT_PERMISSIONS["sales"] || []);
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{ email: string; role: string; password?: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!isOpen) return null;

  // Generate random strong password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let gen = "";
    for (let i = 0; i < 12; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setShowPassword(true);
  };

  // Role selector
  const handleSelectRole = (newRole: string) => {
    setRole(newRole);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || []);
  };

  // Toggle individual permission
  const handleTogglePermission = (permId: string) => {
    setPermissions((prev) => 
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessData(null);

    if (!displayName.trim()) {
      setErrorMessage("Please enter the user's full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateUserData = {
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        role: role,
        permissions: permissions
      };

      const result = await adminCreateUser(payload);
      
      setSuccessData({
        email: email.trim(),
        role: role,
        password: password
      });

      onUserCreated({
        id: result.uid,
        uid: result.uid,
        email: email.trim(),
        displayName: displayName.trim(),
        role: role,
        permissions: permissions,
        disabled: false,
        createdAt: new Date().toISOString()
      });

      // Clear fields
      setDisplayName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Admin user creation failed:", err);
      setErrorMessage(err.message || "Failed to create user account. Please verify your admin credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { id: "admin", label: "Admin", title: "Administrator", desc: "Full System Clearance & Security", icon: "👑", color: "border-red-500/50 text-red-400 bg-red-950/20" },
    { id: "sales", label: "Sales", title: "Sales & Dispatch", desc: "Pipeline, WhatsApp & Coupons", icon: "💼", color: "border-blue-500/50 text-blue-400 bg-blue-950/20" },
    { id: "chef", label: "Chef", title: "Master Kitchen Chef", desc: "Kitchen Queue & Prep Management", icon: "👨‍🍳", color: "border-amber-500/50 text-amber-400 bg-amber-950/20" },
    { id: "menu_lister", label: "Menu Lister", title: "Menu Lister & Curator", desc: "Dishes, Prices & Categories", icon: "🍜", color: "border-emerald-500/50 text-emerald-400 bg-emerald-950/20" },
    { id: "rider", label: "Rider", title: "Logistics Dispatch Rider", desc: "Delivery Zones & Fleet Assignment", icon: "🚴", color: "border-purple-500/50 text-purple-400 bg-purple-950/20" },
    { id: "developer", label: "Dev", title: "Lead Developer", desc: "MySQL Console & Integration", icon: "💻", color: "border-cyan-500/50 text-cyan-400 bg-cyan-950/20" },
    { id: "user", label: "User", title: "Regular Customer", desc: "Orders & Personal Account", icon: "🍽️", color: "border-neutral-700 text-neutral-400 bg-neutral-900" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" id="admin-create-user-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-50 bg-neutral-950 border border-neutral-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded-none text-left animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                <span>Create New User &amp; Assign Role</span>
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Provision a staff or customer account with instant role-based access.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            id="close-create-user-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Success Banner */}
          {successData && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-2 font-mono">
              <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-wider text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>User Created Successfully!</span>
              </div>
              <p className="text-xs text-emerald-200/90 font-sans">
                Account for <strong>{successData.email}</strong> was provisioned with role: <span className="uppercase font-mono font-bold text-amber-400">{successData.role}</span>.
              </p>
              {successData.password && (
                <div className="p-2.5 bg-black/60 border border-emerald-800/60 flex items-center justify-between gap-2 mt-2">
                  <span className="font-mono text-xs text-neutral-300">
                    Temporary Password: <strong className="text-white">{successData.password}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {copiedPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPass ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-mono">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Provisioning Error</span>
                <span className="font-sans text-xs text-red-300/90">{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" id="admin-create-user-form">
            
            {/* Step 1: User Identity Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <User className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-300">
                  1. Account Identity &amp; Login
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Full Name <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Babatunde Alabi"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-xs font-sans placeholder-neutral-600 rounded-none"
                      required
                      id="new-user-name-input"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. chef@mophethonline.com"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-xs font-sans placeholder-neutral-600 rounded-none"
                      required
                      id="new-user-email-input"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                    Temporary Password <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter min 6-character initial passkey"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-xs font-mono placeholder-neutral-600 rounded-none pr-10"
                    required
                    minLength={6}
                    id="new-user-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  The user can modify their password anytime inside their personal profile settings.
                </p>
              </div>
            </div>

            {/* Step 2: Role Selection Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-300">
                  2. Select Assigned Base Role <span className="text-amber-500">*</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const isSelected = role === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectRole(opt.id)}
                      className={`p-3 border cursor-pointer transition-all ${
                        isSelected 
                          ? "border-amber-500 bg-amber-500/10 shadow-sm" 
                          : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{opt.icon}</span>
                          <span className="text-xs font-mono font-bold text-white uppercase">{opt.label}</span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-amber-500 bg-amber-500" : "border-neutral-600"
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black"></span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-sans leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Granular Permissions Customization (Optional) */}
            <div className="border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowCustomPermissions(!showCustomPermissions)}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-mono uppercase font-bold text-neutral-300">
                    Granular Module Clearances ({permissions.length} active)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 text-xs font-mono">
                  <span>{showCustomPermissions ? "Hide" : "Customize"}</span>
                  {showCustomPermissions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {showCustomPermissions && (
                <div className="space-y-4 pt-3 border-t border-neutral-800">
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
                        <span>{cat.icon}</span>
                        <span>{cat.title}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {cat.permissions.map((perm) => {
                          const isChecked = permissions.includes(perm.id);
                          return (
                            <label 
                              key={perm.id} 
                              className="flex items-start gap-2 text-xs font-sans text-neutral-300 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 rounded-none border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <span className="font-mono text-[11px] font-bold text-white block">{perm.name}</span>
                                <span className="text-[10px] text-neutral-500 font-sans leading-tight block">{perm.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                id="submit-create-user-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning User...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create User &amp; Assign Role</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
