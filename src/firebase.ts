import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// The exact high-fidelity representative brand image URL wrapped in a responsive block element
export const DEFAULT_LOGO_SVG = `<img src="https://res.cloudinary.com/dgc6ootad/image/upload/v1780044707/upside_logo_1_swnvtf.jpg" alt="UPSIDE LOGO" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;

export const DEFAULT_BRANDING = {
  logoSvg: DEFAULT_LOGO_SVG,
  brandName: "UPSIDE",
  tagline: "RESTAURANT & CAFÉ",
  subText: "A Brand of Mopheth",
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Function to fetch the branding config from the Firebase Firestore DB, with automatic setup/seeding
export async function getBranding() {
  const docRef = doc(db, "settings", "branding");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure the DB branding has the updated high-fidelity SVG representation
      if (!data.logoSvg || data.logoSvg !== DEFAULT_LOGO_SVG) {
        try {
          await setDoc(docRef, {
            ...DEFAULT_BRANDING,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          return DEFAULT_BRANDING;
        } catch (dbErr) {
          console.warn("Failed to update branding in Firestore DB:", dbErr);
        }
      }
      return data;
    } else {
      // Seed default branding if not present in DB
      try {
        await setDoc(docRef, {
          ...DEFAULT_BRANDING,
          updatedAt: new Date().toISOString(),
        });
      } catch (writeErr) {
        console.warn("Failed to seed branding in Firestore DB:", writeErr);
      }
      return DEFAULT_BRANDING;
    }
  } catch (error) {
    console.error("DB connection fallback. Using default branding:", error);
    return DEFAULT_BRANDING;
  }
}
