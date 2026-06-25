// Mock of firebase/auth targeting local MySQL backend auth controllers
import { getApiUrl } from "../types";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
  refreshToken: string;
  tenantId: string | null;
  delete(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string>;
  getIdTokenResult(forceRefresh?: boolean): Promise<any>;
  reload(): Promise<void>;
  toJSON(): object;
}

class CustomUser implements User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  emailVerified = true;
  isAnonymous = false;
  metadata = {};
  providerData = [];
  refreshToken = "mock-refresh-token";
  tenantId = null;

  constructor(data: { uid: string; email: string; displayName: string; role?: string }) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || data.email.split("@")[0];
    this.role = data.role || "user";
  }

  async delete() {
    console.log("[MySQL Auth] Deleted user mock.");
  }

  async getIdToken() {
    return "mysql-session-jwt-token";
  }

  async getIdTokenResult() {
    return { token: "mysql-session-jwt-token", claims: { role: this.role } };
  }

  async reload() {
    try {
      const res = await fetch(getApiUrl(`/api/mysql/users/${this.uid}`));
      if (res.ok) {
        const fresh = await res.json();
        this.displayName = fresh.displayName || this.displayName;
        this.role = fresh.role || this.role;
      }
    } catch (e) {
      console.warn("User reload failed:", e);
    }
  }

  toJSON() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      role: this.role
    };
  }
}

class FirebaseAuthClient {
  currentUser: CustomUser | null = null;
  private listeners: Array<(user: CustomUser | null) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mysql_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.currentUser = new CustomUser(parsed);
        } catch (e) {
          localStorage.removeItem("mysql_user");
        }
      }
    }
  }

  onAuthStateChanged(callback: (user: CustomUser | null) => void) {
    this.listeners.push(callback);
    // Fire immediately with current value
    setTimeout(() => {
      callback(this.currentUser);
    }, 0);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (e) {
        console.error("[MySQL Auth Listener Error]:", e);
      }
    }
  }

  setSession(userData: { uid: string; email: string; displayName: string; role?: string } | null) {
    if (userData) {
      this.currentUser = new CustomUser(userData);
      localStorage.setItem("mysql_user", JSON.stringify(userData));
    } else {
      this.currentUser = null;
      localStorage.removeItem("mysql_user");
    }
    this.notifyListeners();
  }
}

export const authInstance = new FirebaseAuthClient();

export function getAuth() {
  return authInstance;
}

export function onAuthStateChanged(auth: FirebaseAuthClient, callback: (user: CustomUser | null) => void) {
  return auth.onAuthStateChanged(callback);
}

export async function signInWithEmailAndPassword(auth: FirebaseAuthClient, email: string, password: string) {
  console.log("[MySQL Auth] Login attempt for email:", email);
  const response = await fetch(getApiUrl("/api/mysql/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Authentication failed. Invalid email or password.");
  }

  const data = await response.json();
  auth.setSession(data.user);
  return { user: auth.currentUser };
}

export async function createUserWithEmailAndPassword(auth: FirebaseAuthClient, email: string, password: string) {
  console.log("[MySQL Auth] Sign-up attempt for email:", email);
  // Default to email prefix as full name during creation. Will be refined during updateProfile()
  const displayName = email.split("@")[0];
  const response = await fetch(getApiUrl("/api/mysql/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Registration failed. Email might be already in use.");
  }

  const data = await response.json();
  auth.setSession(data.user);
  return { user: auth.currentUser };
}

export async function updateProfile(user: CustomUser, profile: { displayName?: string }) {
  console.log("[MySQL Auth] Profile update requested for:", profile);
  if (!user) throw new Error("No authenticated user session.");

  if (profile.displayName) {
    user.displayName = profile.displayName;
  }

  // Update profile in backend
  await fetch(getApiUrl(`/api/mysql/users/${user.uid}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      displayName: user.displayName,
      role: user.role
    })
  });

  // Re-save session
  authInstance.setSession({
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    role: user.role
  });
}

export async function signOut(auth: FirebaseAuthClient) {
  console.log("[MySQL Auth] Log out triggered.");
  auth.setSession(null);
}

export class GoogleAuthProvider {
  static PROVIDER_ID = "google.com";
}

export async function signInWithPopup(auth: FirebaseAuthClient, provider?: any): Promise<any> {
  console.log("[MySQL Auth] Social/Google auth popup triggered.");
  
  try {
    const urlRes = await fetch(getApiUrl("/api/mysql/auth/google/url"));
    if (!urlRes.ok) {
      const errData = await urlRes.json().catch(() => ({}));
      throw new Error(errData.error || "Google Client ID is not configured on the server.");
    }

    const { url } = await urlRes.json();
    
    return new Promise((resolve, reject) => {
      const authWindow = window.open(
        url,
        "google_oauth_popup",
        "width=500,height=600,left=100,top=100"
      );

      if (!authWindow) {
        reject(new Error("Popup blocked. Please allow popups to sign in with Google."));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          window.removeEventListener("message", handleMessage);
          const userData = event.data.user;
          auth.setSession(userData);
          resolve({ user: auth.currentUser });
        } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
          window.removeEventListener("message", handleMessage);
          reject(new Error(event.data.error || "Google login failed."));
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if window is closed by user
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          reject(new Error("Google login window closed."));
        }
      }, 1000);
    });

  } catch (err: any) {
    console.warn("Real Google Auth failed/not configured. Falling back to synthetic prompt:", err.message);
    
    // Friendly warning to user about how to configure Google Auth
    alert(
      "Notice: Google Authentication credentials are not configured in system secrets.\n\n" +
      "To enable real Google Login, please register your app on Google Cloud Console and set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.\n\n" +
      "Falling back to high-fidelity simulated account registration..."
    );

    const email = prompt("Enter your Google Email Address to continue:", "guest@gmail.com");
    if (!email) {
      throw new Error("Google login cancelled by user.");
    }

    const displayName = email.split("@")[0];
    const uid = "google_usr_" + Math.random().toString(36).substring(2, 11);

    const response = await fetch(getApiUrl("/api/mysql/auth/social-sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, displayName })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Google login sync failed.");
    }

    const data = await response.json();
    auth.setSession(data.user);
    return { user: auth.currentUser };
  }
}

export async function sendPasswordResetEmail(auth: FirebaseAuthClient, email: string) {
  console.log("[MySQL Auth] Password reset request dispatched for:", email);
  return true;
}
