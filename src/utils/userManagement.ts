import { initializeApp, deleteApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  updatePassword as fbUpdatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { getApiUrl } from "../types";

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: string;
  permissions?: string[];
}

export interface PermissionItem {
  id: string;
  name: string;
  desc: string;
}

export interface PermissionCategory {
  id: string;
  title: string;
  icon: string;
  permissions: PermissionItem[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "orders",
    title: "Orders & Kitchen Operations",
    icon: "🛍️",
    permissions: [
      { id: "orders_pipeline", name: "Orders Pipeline", desc: "View kitchen queue, update cooking stages, and assign dispatch riders." },
      { id: "whatsapp_orders", name: "WhatsApp & Manual Orders", desc: "Audit and approve WhatsApp manual orders & bank transfer slips." }
    ]
  },
  {
    id: "catalog",
    title: "Menu & Dish Catalog Management",
    icon: "🍜",
    permissions: [
      { id: "menus_panel", name: "Dynamic Menu Manager", desc: "Add, edit prices, descriptions, ingredients, and remove dishes." },
      { id: "categories_panel", name: "Category Classifications", desc: "Manage menu category titles, display ordering, and enable/disable states." },
      { id: "images_panel", name: "Image Asset Library", desc: "Upload single or bulk high-res dish photos and manage visual assets." }
    ]
  },
  {
    id: "logistics",
    title: "Logistics & Delivery Fleet",
    icon: "🚚",
    permissions: [
      { id: "shipping_panel", name: "Delivery Locations & Zones", desc: "Set Lagos delivery fees, coverage zones, and turnaround times." },
      { id: "riders_panel", name: "Logistics Riders Fleet", desc: "Register dispatch riders, monitor fleet statuses, and assign orders." }
    ]
  },
  {
    id: "growth",
    title: "Marketing & Growth",
    icon: "🎟️",
    permissions: [
      { id: "coupons_panel", name: "Coupons & Discounts", desc: "Create discount promo codes, % sales campaigns, and min order thresholds." },
      { id: "analytics_panel", name: "Analytics & PDF Reports", desc: "View sales graphs, live conversion rates, and export executive PDF reports." }
    ]
  },
  {
    id: "crm",
    title: "Customer Support & Live Chat",
    icon: "💬",
    permissions: [
      { id: "support_panel", name: "Support Desk & Live Chat", desc: "Live customer chat responses and support ticket resolution." }
    ]
  },
  {
    id: "system",
    title: "System, Payment & Database",
    icon: "⚙️",
    permissions: [
      { id: "users_panel", name: "User Directory & Access Control", desc: "Manage staff roles, grant categorized permission checkboxes, and suspend users." },
      { id: "opay_panel", name: "OPay Payment Gateway", desc: "Configure live merchant keys and webhook security settings." },
      { id: "mysql_panel", name: "MySQL Database Console", desc: "Direct database table queries, SQL commands, and health checks." }
    ]
  }
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "orders_pipeline", "whatsapp_orders", "menus_panel", "categories_panel",
    "images_panel", "shipping_panel", "riders_panel", "coupons_panel",
    "analytics_panel", "support_panel", "users_panel",
    "opay_panel", "mysql_panel"
  ],
  sales: [
    "orders_pipeline", "whatsapp_orders", "coupons_panel", "analytics_panel", "support_panel"
  ],
  chef: [
    "orders_pipeline"
  ],
  menu_lister: [
    "menus_panel", "categories_panel", "images_panel"
  ],
  rider: [
    "shipping_panel", "riders_panel"
  ],
  developer: [
    "mysql_panel", "opay_panel"
  ],
  user: []
};

/**
 * Admin creates a user without terminating or overwriting the active administrator session.
 * Uses an isolated secondary Firebase App instance and synchronizes with Firestore and MySQL.
 */
export async function adminCreateUser(data: CreateUserData): Promise<{ uid: string; email: string; displayName: string; role: string; permissions: string[] }> {
  const cleanEmail = data.email.toLowerCase().trim();
  const cleanName = data.displayName.trim();
  const role = data.role || "user";
  const permissions = data.permissions || [];

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }
  if (!data.password || data.password.length < 6) {
    throw new Error("Password must be at least 6 characters in length.");
  }
  if (!cleanName) {
    throw new Error("Please enter a full name for the user.");
  }

  // 1. Create credentials in Firebase Auth via an isolated secondary app instance
  const secondaryAppName = `AdminUserCreator_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let newUid = "";
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, data.password);
    newUid = cred.user.uid;
    await updateProfile(cred.user, { displayName: cleanName });
    await signOut(secondaryAuth);
  } catch (authErr: any) {
    // If user already exists in auth or other error
    let message = authErr.message || "Failed to create user in authentication provider.";
    if (authErr.code === "auth/email-already-in-use") {
      message = `An account with email "${cleanEmail}" already exists.`;
    } else if (authErr.code === "auth/weak-password") {
      message = "The password provided is too weak. Please use at least 6 alphanumeric characters.";
    } else if (authErr.code === "auth/invalid-email") {
      message = "The email address is invalid.";
    }
    throw new Error(message);
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (_) {}
  }

  // 2. Persist the user profile and assigned role in Firestore
  const userProfile = {
    uid: newUid,
    email: cleanEmail,
    displayName: cleanName,
    role,
    permissions,
    disabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByAdmin: auth.currentUser?.email || "admin"
  };

  try {
    const userDocRef = doc(db, "users", newUid);
    await setDoc(userDocRef, userProfile);
  } catch (fsErr: any) {
    console.error("[adminCreateUser] Firestore write warning:", fsErr);
  }

  // 3. Sync to MySQL backend if active
  try {
    await fetch(getApiUrl(`/api/mysql/users/${newUid}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        displayName: cleanName,
        role,
        permissions,
        disabled: false
      })
    });
  } catch (_) {}

  return {
    uid: newUid,
    email: cleanEmail,
    displayName: cleanName,
    role,
    permissions
  };
}

/**
 * Updates the display name for the currently authenticated user across Firebase Auth, Firestore, and MySQL.
 * Strictly leaves the email address untouched.
 */
export async function updateCurrentUserName(newDisplayName: string, fallbackUser?: any): Promise<void> {
  const activeUser = auth.currentUser || fallbackUser;
  const uid = activeUser?.uid || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mysql_user") || "{}")?.uid : null);
  
  if (!uid) {
    throw new Error("You must be logged in to update your profile.");
  }

  const cleanName = newDisplayName.trim();
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Display name must be at least 2 characters.");
  }

  // 1. Update Firebase Auth Profile if activeUser is available
  if (activeUser) {
    try {
      await updateProfile(activeUser, { displayName: cleanName });
    } catch (authErr) {
      console.warn("[updateCurrentUserName] Auth profile update notice:", authErr);
    }
  }

  // 2. Update Firestore User Document
  try {
    const userDocRef = doc(db, "users", uid);
    const existingSnap = await getDoc(userDocRef);
    
    if (existingSnap && existingSnap.exists && existingSnap.exists()) {
      await updateDoc(userDocRef, {
        displayName: cleanName,
        updatedAt: new Date().toISOString()
      });
    } else {
      await setDoc(userDocRef, {
        uid: uid,
        email: activeUser?.email || "",
        displayName: cleanName,
        role: activeUser?.role || "user",
        disabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (fsErr) {
    console.warn("[updateCurrentUserName] Firestore document sync notice:", fsErr);
  }

  // 3. Update MySQL backend
  try {
    await fetch(getApiUrl(`/api/mysql/users/${uid}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        displayName: cleanName,
        email: activeUser?.email || undefined
      })
    });
  } catch (_) {}

  // 4. Update localStorage cached session
  try {
    const cachedStr = localStorage.getItem("mysql_user");
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      parsed.displayName = cleanName;
      localStorage.setItem("mysql_user", JSON.stringify(parsed));
    }
  } catch (_) {}
}

/**
 * Updates the password for the currently authenticated user.
 * Re-authenticates with the existing password if provided/required.
 */
export async function updateCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in to change your password.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  // If user has email and current password provided, reauthenticate
  if (currentUser.email && currentPassword) {
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    } catch (reauthErr: any) {
      if (reauthErr.code === "auth/wrong-password" || reauthErr.code === "auth/invalid-credential") {
        throw new Error("Current password is incorrect. Please verify and try again.");
      }
      throw new Error(reauthErr.message || "Failed to verify current password.");
    }
  }

  // Update password in Firebase Auth
  try {
    await fbUpdatePassword(currentUser, newPassword);
  } catch (updateErr: any) {
    if (updateErr.code === "auth/requires-recent-login") {
      throw new Error("For security purposes, please log out and log back in before changing your password.");
    }
    throw new Error(updateErr.message || "Unable to update password. Please try again.");
  }

  // Sync to MySQL if active
  try {
    await fetch(getApiUrl("/api/mysql/auth/change-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: currentUser.uid,
        newPassword
      })
    });
  } catch (_) {}
}

/**
 * Sends a password reset email to the given address.
 * Dispatches via MySQL SMTP service and triggers Firebase Auth reset in tandem.
 */
export async function sendUserPasswordResetEmail(email: string, displayName?: string, uid?: string): Promise<{ success: boolean; message: string; previewLink?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  let resultMsg = "Password reset instructions dispatched successfully.";
  let previewLink: string | undefined;

  // 1. Send via Backend Mailer
  try {
    const res = await fetch(getApiUrl("/api/mysql/auth/send-password-reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, displayName, uid })
    });
    if (res.ok) {
      const data = await res.json();
      resultMsg = data.message || resultMsg;
      previewLink = data.resetLink;
    }
  } catch (backendErr) {
    console.warn("[sendUserPasswordResetEmail] Backend mail service notice:", backendErr);
  }

  // 2. Trigger Firebase Auth Password Reset if active
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (fbErr: any) {
    console.warn("[sendUserPasswordResetEmail] Firebase Auth reset notification:", fbErr?.message);
  }

  return { success: true, message: resultMsg, previewLink };
}

/**
 * Admin utility to update any user's profile information, role, security clearance, or direct password.
 */
export async function adminUpdateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    email?: string;
    role?: string;
    disabled?: boolean;
    permissions?: string[];
    newPassword?: string;
  }
): Promise<void> {
  if (!uid) {
    throw new Error("User ID is required for profile modification.");
  }

  const cleanName = updates.displayName ? updates.displayName.trim() : undefined;
  const cleanRole = updates.role ? updates.role.trim() : undefined;

  // 1. Update Firestore User Document
  try {
    const userDocRef = doc(db, "users", uid);
    const existingSnap = await getDoc(userDocRef);

    const firestoreData: any = {
      updatedAt: new Date().toISOString()
    };
    if (cleanName !== undefined) firestoreData.displayName = cleanName;
    if (cleanRole !== undefined) firestoreData.role = cleanRole;
    if (updates.disabled !== undefined) firestoreData.disabled = updates.disabled;
    if (updates.permissions !== undefined) firestoreData.permissions = updates.permissions;

    if (existingSnap && existingSnap.exists && existingSnap.exists()) {
      await updateDoc(userDocRef, firestoreData);
    } else {
      await setDoc(userDocRef, {
        uid,
        email: updates.email || "",
        displayName: cleanName || "User",
        role: cleanRole || "user",
        disabled: !!updates.disabled,
        permissions: updates.permissions || [],
        createdAt: new Date().toISOString(),
        ...firestoreData
      }, { merge: true });
    }
  } catch (fsErr) {
    console.warn("[adminUpdateUserProfile] Firestore sync notice:", fsErr);
  }

  // 2. Update MySQL User Record
  try {
    const res = await fetch(getApiUrl(`/api/mysql/users/${uid}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: cleanName,
        email: updates.email,
        role: cleanRole,
        disabled: updates.disabled,
        permissions: updates.permissions
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("[adminUpdateUserProfile] MySQL PUT warning:", errData.error);
    }
  } catch (mysqlErr) {
    console.warn("[adminUpdateUserProfile] MySQL sync notice:", mysqlErr);
  }

  // 3. If direct password was supplied, update password
  if (updates.newPassword && updates.newPassword.length >= 6) {
    try {
      await fetch(getApiUrl(`/api/mysql/users/${uid}/password`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: updates.newPassword })
      });
    } catch (passErr) {
      console.warn("[adminUpdateUserProfile] Password sync warning:", passErr);
    }
  }
}
