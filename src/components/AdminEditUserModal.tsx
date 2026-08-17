import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Sparkles
} from "lucide-react";
import {
  PERMISSION_CATEGORIES,
  ROLE_DEFAULT_PERMISSIONS
} from "../utils/userManagement";
import { adminUpdateUserProfile, sendUserPasswordResetEmail } from "../utils/userManagement";

export interface EditUserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  disabled?: boolean;
  permissions?: string[];
  createdAt?: string;
}

interface AdminEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditUserData | null;
  onUserUpdated: (updatedUser: EditUserData) => void;
}

export default function AdminEditUserModal({
  isOpen,
  onClose,
  user,
  onUserUpdated
}: AdminEditUserModalProps) {
  if (!isOpen || !user) return null;

  // Form State
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [role, setRole] = useState(user.role || "user");
  const [disabled, setDisabled] = useState(!!user.disabled);
  const [permissions, setPermissions] = useState<string[]>(
    Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : (ROLE_DEFAULT_PERMISSIONS[user.role || "user"] || [])
  );
  
  // Optional direct password assignment
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newDirectPassword, setNewDirectPassword] = useState("");
  const [showDirectPassword, setShowDirectPassword] = useState(false);

  // Status and feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [previewResetLink, setPreviewResetLink] = useState("");

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setRole(user.role || "user");
      setDisabled(!!user.disabled);
      setPermissions(
        Array.isArray(user.permissions) && user.permissions.length > 0
          ? user.permissions
          : (ROLE_DEFAULT_PERMISSIONS[user.role || "user"] || [])
      );
      setNewDirectPassword("");
      setShowPasswordSection(false);
      setSaveSuccess("");
      setSaveError("");
      setResetSuccess("");
      setResetError("");
      setPreviewResetLink("");
    }
  }, [user]);

  // Apply Role Default Preset
  const handleApplyRoleDefaults = (newRole: string) => {
    setRole(newRole);
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || [];
    setPermissions(defaults);
  };

  // Toggle Single Permission
  const handleTogglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Toggle Full Category
  const handleToggleCategory = (catId: string) => {
    const category = PERMISSION_CATEGORIES.find((c) => c.id === catId);
    if (!category) return;
    const catKeys = category.permissions.map((p) => p.id);
    const allSelected = catKeys.every((k) => permissions.includes(k));

    if (allSelected) {
      setPermissions((prev) => prev.filter((p) => !catKeys.includes(p)));
    } else {
      setPermissions((prev) => Array.from(new Set([...prev, ...catKeys])));
    }
  };

  // Dispatch Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user.email) {
      setResetError("This user does not have a registered email address.");
      return;
    }

    setIsSendingReset(true);
    setResetError("");
    setResetSuccess("");
    setPreviewResetLink("");

    try {
      const res = await sendUserPasswordResetEmail(user.email, displayName || user.displayName, user.id);
      setResetSuccess(res.message || `Password reset instructions sent to ${user.email}`);
      if (res.previewLink) {
        setPreviewResetLink(res.previewLink);
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to dispatch password reset email.");
    } finally {
      setIsSendingReset(false);
    }
  };

  // Save All Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    if (!displayName.trim() || displayName.trim().length < 2) {
      setSaveError("Display name must be at least 2 characters.");
      return;
    }

    if (newDirectPassword && newDirectPassword.length < 6) {
      setSaveError("New password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    try {
      await adminUpdateUserProfile(user.id, {
        displayName: displayName.trim(),
        email: user.email,
        role,
        disabled,
        permissions,
        newPassword: newDirectPassword || undefined
      });

      const updatedObj: EditUserData = {
        ...user,
        displayName: displayName.trim(),
        role,
        disabled,
        permissions
      };

      setSaveSuccess("User profile and security permissions updated successfully!");
      onUserUpdated(updatedObj);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update user profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
      id="admin-edit-user-modal"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl rounded-none my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-base font-mono">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                  Edit Staff &amp; User Profile
                </h3>
                <span className="px-2 py-0.5 bg-neutral-800 text-[10px] text-neutral-300 font-mono uppercase">
                  UID: {user.id.slice(0, 10)}...
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Update account identity, assign functional roles, grant granular security clearances, or dispatch reset instructions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-800 transition-colors cursor-pointer"
            id="close-admin-edit-user-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notifications */}
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 text-blue-300 text-xs space-y-2 font-mono animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
              {previewResetLink && (
                <div className="p-2 bg-black/60 border border-blue-900/50 text-[11px] text-blue-200 break-all font-mono">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold mb-1">Generated Reset URL:</span>
                  <a href={previewResetLink} target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-amber-300">
                    {previewResetLink}
                  </a>
                </div>
              )}
            </div>
          )}

          {resetError && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {/* Section 1: Account Identity & Email Details */}
          <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-2 pb-2 border-b border-neutral-800">
              <User className="w-3.5 h-3.5" />
              <span>Account Identity &amp; Status</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Full Display Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Oluwaseun Adeleke"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-xs font-sans rounded-none"
                  required
                  id="admin-edit-user-displayname"
                />
              </div>

              {/* Email Address (Read-only for security) */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Registered Email</span>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-neutral-900/60 border border-neutral-800 text-neutral-400 text-xs font-mono cursor-not-allowed rounded-none"
                  />
                  <Mail className="w-3.5 h-3.5 text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Role & Account Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Assigned System Role</span>
                  <span className="text-[10px] text-amber-500 font-mono">Applies Role Presets</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => handleApplyRoleDefaults(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-500 focus:outline-none text-white text-xs font-mono rounded-none"
                  id="admin-edit-user-role"
                >
                  <option value="user">User (Client Default)</option>
                  <option value="sales">Sales &amp; Dispatch Rep</option>
                  <option value="chef">Chef / Kitchen Lead</option>
                  <option value="menu_lister">Menu Lister</option>
                  <option value="rider">Logistics Rider (Fleet)</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              {/* Account Status Switch */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Account Status
                </label>
                <div className="flex items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setDisabled(false)}
                    className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 border text-xs font-mono uppercase font-bold transition-colors cursor-pointer ${
                      !disabled
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisabled(true)}
                    className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 border text-xs font-mono uppercase font-bold transition-colors cursor-pointer ${
                      disabled
                        ? "bg-red-950/50 border-red-500 text-red-400"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Suspended</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Password Reset & Security Mailer */}
          <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password &amp; Access Controls</span>
              </h4>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Self-Service Mailer</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-900/70 border border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-white block">
                  Send Password Reset Message via Mail
                </span>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Dispatches a secure link with a 24-hour verification PIN directly to <span className="text-amber-400 font-mono">{user.email}</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingReset || !user.email}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
                id="admin-send-password-reset-btn"
              >
                {isSendingReset ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Password Assignment Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{showPasswordSection ? "▲ Hide Direct Password Setter" : "▼ Admin Override: Set Temporary Password Directly"}</span>
              </button>

              {showPasswordSection && (
                <div className="mt-3 p-3.5 bg-neutral-900 border border-neutral-800 space-y-2 animate-fade-in">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                    New Temporary Password (min 6 chars)
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type={showDirectPassword ? "text" : "password"}
                      value={newDirectPassword}
                      onChange={(e) => setNewDirectPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 text-white text-xs font-mono pr-10 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDirectPassword(!showDirectPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {showDirectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    If set, the user can log in immediately with this password without needing an email confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Granular Clearance Permissions Breakdown */}
          <div className="bg-neutral-950 border border-neutral-800 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Granular Security Clearances &amp; Modules</span>
                </h4>
                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                  Checkboxes control individual tabs and administrative operational dashboards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allKeys = PERMISSION_CATEGORIES.flatMap((c) => c.permissions.map((p) => p.id));
                    setPermissions(allKeys);
                  }}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => setPermissions([])}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-mono uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRoleDefaults(role)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider border border-amber-500/30 transition-colors cursor-pointer"
                >
                  Role Default
                </button>
              </div>
            </div>

            {/* Categorized Checkbox Groups */}
            <div className="space-y-4 pt-1">
              {PERMISSION_CATEGORIES.map((cat) => {
                const catKeys = cat.permissions.map((p) => p.id);
                const allCatSelected = catKeys.every((k) => permissions.includes(k));
                const someCatSelected = catKeys.some((k) => permissions.includes(k));

                return (
                  <div key={cat.id} className="bg-neutral-900/60 border border-neutral-850 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <h5 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
                          {cat.title}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                          allCatSelected
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : someCatSelected
                            ? "bg-neutral-800 text-neutral-300 border-neutral-700"
                            : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-400"
                        }`}
                      >
                        {allCatSelected ? "Deselect All" : "Select Category"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cat.permissions.map((perm) => {
                        const isChecked = permissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2.5 p-2 border transition-colors cursor-pointer select-none ${
                              isChecked
                                ? "bg-amber-950/25 border-amber-500/40 text-neutral-100"
                                : "bg-neutral-950/50 border-neutral-850 text-neutral-400 hover:bg-neutral-950"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="mt-0.5 accent-amber-500 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs font-mono font-semibold block leading-tight">
                                {perm.name}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-sans block leading-tight">
                                {perm.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              id="admin-save-user-profile-btn"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save User Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
