import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import { initializeApp as initClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp as clientServerTimestamp } from "firebase/firestore";
import { stripQuotes } from "./env.js";

class CustomCollectionReference {
  constructor(private db: any, private pathStr: string) {}
  
  doc(docId: string) {
    return new CustomDocumentReference(this.db, this.pathStr, docId);
  }
}

class CustomDocumentReference {
  constructor(private db: any, private pathStr: string, private docId: string) {}

  async get() {
    const dRef = doc(this.db, this.pathStr, this.docId);
    const snap = await getDoc(dRef);
    return {
      exists: snap.exists(),
      data: () => snap.data()
    };
  }

  async set(data: any, options?: any) {
    const dRef = doc(this.db, this.pathStr, this.docId);
    const payload = this.sanitize({
      ...data,
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
    });
    return await setDoc(dRef, payload, options);
  }

  async update(data: any) {
    const dRef = doc(this.db, this.pathStr, this.docId);
    const payload = this.sanitize({
      ...data,
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
    });
    return await updateDoc(dRef, payload);
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    const copy = { ...obj };
    for (const k of Object.keys(copy)) {
      if (copy[k] && typeof copy[k] === "object") {
        const constructorName = copy[k].constructor ? copy[k].constructor.name : null;
        if (constructorName === "FieldValue" || copy[k]._methodName === "FieldValue.serverTimestamp") {
          copy[k] = clientServerTimestamp();
        } else {
          copy[k] = this.sanitize(copy[k]);
        }
      }
    }
    return copy;
  }
}

export let dbAdmin: any = null;

try {
  let projectId = "gen-lang-client-0332471137";
  let databaseId = "";
  let config: any = null;

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    config = {
      projectId: stripQuotes(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "gen-lang-client-0332471137"),
      apiKey: stripQuotes(process.env.FIREBASE_API_KEY || "AIzaSyBlIddU4ZP6QsC212vb__3AoMKH9MA-_1E"),
      authDomain: stripQuotes(process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0332471137.firebaseapp.com"),
      firestoreDatabaseId: stripQuotes(process.env.FIREBASE_DATABASE_ID || process.env.FIRESTORE_DB_NAME || "ai-studio-7ee29b67-2013-4587-a753-b479a6e19155"),
      appId: stripQuotes(process.env.FIREBASE_APP_ID || "1:603064167629:web:81ee6a02fc18f423460d84"),
      storageBucket: stripQuotes(process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0332471137.firebasestorage.app"),
      messagingSenderId: stripQuotes(process.env.FIREBASE_MESSAGING_SENDER_ID || "603064167629")
    };
  }

  if (config) {
    if (config.projectId) {
      projectId = config.projectId;
    }
    if (config.firestoreDatabaseId) {
      databaseId = config.firestoreDatabaseId;
    }
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: projectId,
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (credErr) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: projectId
      });
    }
  }

  if (config) {
    const clientApp = initClientApp(config);
    const dbClient = getClientFirestore(clientApp, databaseId);
    dbAdmin = {
      collection(pathStr: string) {
        return new CustomCollectionReference(dbClient, pathStr);
      }
    };
    console.log("[FIREBASE CLIENT MIMIC] Hooked dbAdmin successfully from modular database service.");
  } else {
    console.warn("[FIREBASE CLIENT MIMIC] Config file not found. Falling back to default admin firestore.");
    dbAdmin = admin.firestore();
  }
} catch (firebaseErr: any) {
  console.error("[FIREBASE CLIENT MIMIC] Setup failed:", firebaseErr);
}
