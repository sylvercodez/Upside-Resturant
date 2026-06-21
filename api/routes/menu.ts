import express from "express";
import path from "path";
import fs from "fs";
import { CATEGORIES, MENU_ITEMS } from "../../src/data/menu.js";

export const menuRouter = express.Router();

menuRouter.get("/", async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let databaseId = "ai-studio-7ee29b67-2013-4587-a753-b479a6e19155";
    let firebaseConfig: any = null;
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (firebaseConfig.firestoreDatabaseId) databaseId = firebaseConfig.firestoreDatabaseId;
    } else {
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "gen-lang-client-0332471137",
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBlIddU4ZP6QsC212vb__3AoMKH9MA-_1E",
        authDomain: (process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0332471137") + ".firebaseapp.com"
      };
    }

    const { initializeApp: seedInitApp } = await import("firebase/app");
    const { getFirestore: seedGetFirestore, doc: seedDoc, getDocs: seedGetDocs, collection: seedCollection, setDoc: seedSetDoc } = await import("firebase/firestore");

    const clientApp = seedInitApp(firebaseConfig, "seed-menu-app");
    const db = seedGetFirestore(clientApp, databaseId);

    const systemKey = "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9";

    // 1. Mark obsolete categories as deleted
    const catQuerySnapshot = await seedGetDocs(seedCollection(db, "categories"));
    const existingCatNames = new Set(CATEGORIES.map(c => c.id));
    for (const d of catQuerySnapshot.docs) {
      if (!existingCatNames.has(d.id)) {
        await seedSetDoc(seedDoc(db, "categories", d.id), { deleted: true, systemWriteKey: systemKey }, { merge: true });
      }
    }

    // 2. Mark obsolete menus as deleted
    const menuQuerySnapshot = await seedGetDocs(seedCollection(db, "menus"));
    const existingMenuNames = new Set(MENU_ITEMS.map(m => m.id));
    for (const d of menuQuerySnapshot.docs) {
      if (!existingMenuNames.has(d.id)) {
        await seedSetDoc(seedDoc(db, "menus", d.id), { deleted: true, systemWriteKey: systemKey }, { merge: true });
      }
    }

    // 3. Keep synced and live categories
    let catsSynced = 0;
    for (const cat of CATEGORIES) {
      await seedSetDoc(seedDoc(db, "categories", cat.id), {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        deleted: false,
        updatedAt: new Date().toISOString(),
        systemWriteKey: systemKey
      });
      catsSynced++;
    }

    // 4. Keep synced and live menu items
    let menusSynced = 0;
    for (const item of MENU_ITEMS) {
      await seedSetDoc(seedDoc(db, "menus", item.id), {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        tags: item.tags || [],
        specs: item.specs || [],
        deleted: false,
        updatedAt: new Date().toISOString(),
        systemWriteKey: systemKey
      });
      menusSynced++;
    }

    res.json({
      status: "success",
      message: `Database successfully seeded with ${catsSynced} categories and ${menusSynced} menu items!`,
      databaseId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});
