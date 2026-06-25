// Mock of firebase/firestore targeting local MySQL REST endpoints
import { getApiUrl } from "../types";

export function getFirestore(app?: any, databaseId?: string) {
  return { name: "mysql-firestore", databaseId };
}

export function doc(db: any, collectionName: string, docId: string) {
  return { type: "doc", collection: collectionName, id: docId, db };
}

export function collection(db: any, collectionName: string) {
  return { type: "collection", name: collectionName, db };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { type: "query", ref: collectionRef, constraints };
}

export function where(field: string, operator: string, value: any) {
  return { type: "where", field, operator, value };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(value: number) {
  return { type: "limit", value };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// Convert backend MySQL row structure to mock firestore DocumentSnapshot
function makeDocSnap(id: string, data: any) {
  const exists = !!data;
  return {
    id,
    exists: () => exists,
    data: () => data || null
  };
}

// Convert collection of items to mock QuerySnapshot
function makeQuerySnap(docs: any[]) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map(d => makeDocSnap(d.id || d.uid, d)),
    forEach: (callback: (doc: any) => void) => {
      docs.map(d => makeDocSnap(d.id || d.uid, d)).forEach(callback);
    }
  };
}

// Fetch single document
export async function getDoc(docRef: any): Promise<any> {
  const { collection, id } = docRef;

  try {
    if (collection === "settings") {
      const res = await fetch(getApiUrl(`/api/mysql/settings/${id}`));
      if (res.status === 404) {
        // Return doesn't exist
        return makeDocSnap(id, null);
      }
      if (!res.ok) {
        let errDetails = "";
        try {
          const errJson = await res.json();
          errDetails = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          try { errDetails = await res.text(); } catch (_) {}
        }
        throw new Error(`Failed to load setting: ${res.status} - ${errDetails || res.statusText}`);
      }
      const data = await res.json();
      return makeDocSnap(id, data);
    }

    if (collection === "users") {
      const res = await fetch(getApiUrl(`/api/mysql/users/${id}`));
      if (res.status === 404) return makeDocSnap(id, null);
      if (!res.ok) {
        let errDetails = "";
        try {
          const errJson = await res.json();
          errDetails = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          try { errDetails = await res.text(); } catch (_) {}
        }
        throw new Error(`Failed to load user: ${res.status} - ${errDetails || res.statusText}`);
      }
      const data = await res.json();
      return makeDocSnap(id, data);
    }

    if (collection === "orders") {
      const res = await fetch(getApiUrl(`/api/mysql/orders/${id}`));
      if (res.status === 404) return makeDocSnap(id, null);
      if (!res.ok) {
        let errDetails = "";
        try {
          const errJson = await res.json();
          errDetails = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          try { errDetails = await res.text(); } catch (_) {}
        }
        throw new Error(`Failed to load order: ${res.status} - ${errDetails || res.statusText}`);
      }
      const data = await res.json();
      return makeDocSnap(id, data);
    }

    if (collection === "riders") {
      const res = await fetch(getApiUrl(`/api/mysql/riders/${id}`));
      if (res.status === 404) return makeDocSnap(id, null);
      if (!res.ok) {
        let errDetails = "";
        try {
          const errJson = await res.json();
          errDetails = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch (_) {
          try { errDetails = await res.text(); } catch (_) {}
        }
        throw new Error(`Failed to load rider: ${res.status} - ${errDetails || res.statusText}`);
      }
      const data = await res.json();
      return makeDocSnap(id, data);
    }

    // Default fallback - check in transient localStorage first
    try {
      const valStr = localStorage.getItem(`transient_collection_${collection}_${id}`);
      if (valStr) {
        return makeDocSnap(id, JSON.parse(valStr));
      }
    } catch (_) {}

    return makeDocSnap(id, null);
  } catch (err) {
    console.warn(`[MySQL Firestore getDoc Error] Falling back to default:`, err);
    return makeDocSnap(id, null);
  }
}

// Fetch collection/docs
export async function getDocs(queryOrRef: any): Promise<any> {
  let ref = queryOrRef;
  let constraints: any[] = [];
  if (queryOrRef.type === "query") {
    ref = queryOrRef.ref;
    constraints = queryOrRef.constraints || [];
  }

  const collectionName = ref.name;

  try {
    let url = "";
    if (collectionName === "categories") url = getApiUrl("/api/mysql/categories");
    else if (collectionName === "menus" || collectionName === "menu") url = getApiUrl("/api/mysql/menus");
    else if (collectionName === "shipping_areas" || collectionName === "shipping-areas") url = getApiUrl("/api/mysql/shipping-areas");
    else if (collectionName === "orders") url = getApiUrl("/api/mysql/orders");
    else if (collectionName === "users") url = getApiUrl("/api/mysql/users/all");
    else if (collectionName === "riders") url = getApiUrl("/api/mysql/riders");
    else if (collectionName === "analytics_events") url = getApiUrl("/api/mysql/analytics");
    else if (collectionName === "assets") url = getApiUrl("/api/mysql/assets");

    if (!url) {
      console.warn(`[MySQL Firestore] Unsupported collection name: ${collectionName}`);
      return makeQuerySnap([]);
    }

    const res = await fetch(url);
    if (!res.ok) {
      let errDetails = "";
      try {
        const errJson = await res.json();
        errDetails = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch (_) {
        try { errDetails = await res.text(); } catch (_) {}
      }
      throw new Error(`Failed to load collection ${collectionName}: ${res.status} - ${errDetails || res.statusText}`);
    }
    let data = await res.json();

    // Client-side filtering/constraints application
    for (const c of constraints) {
      if (c && c.type === "where") {
        const { field, operator, value } = c;
        data = data.filter((item: any) => {
          const itemVal = item[field];
          if (operator === "==") return itemVal === value;
          if (operator === "!=") return itemVal !== value;
          if (operator === ">") return itemVal > value;
          if (operator === "<") return itemVal < value;
          if (operator === "array-contains") return Array.isArray(itemVal) && itemVal.includes(value);
          return true;
        });
      }
    }

    return makeQuerySnap(data);
  } catch (err) {
    console.error(`[MySQL Firestore getDocs Error]:`, err);
    return makeQuerySnap([]);
  }
}

// Write/Update documents
export async function setDoc(docRef: any, data: any, options?: any): Promise<void> {
  const { collection, id } = docRef;

  let payload = data;
  if (options && options.merge) {
    try {
      const current = await getDoc(docRef);
      if (current.exists()) {
        payload = { ...current.data(), ...data };
      }
    } catch (_) {}
  }

  let url = "";
  let method = "POST";

  if (collection === "settings") {
    url = getApiUrl(`/api/mysql/settings/${id}`);
  } else if (collection === "users") {
    url = getApiUrl(`/api/mysql/users/${id}`);
  } else if (collection === "orders") {
    url = getApiUrl(`/api/mysql/orders`);
    payload = { id, ...payload };
  } else if (collection === "categories") {
    url = getApiUrl(`/api/mysql/categories`);
    payload = { id, ...payload };
  } else if (collection === "menus" || collection === "menu") {
    url = getApiUrl(`/api/mysql/menus`);
    payload = { id, ...payload };
  } else if (collection === "shipping_areas" || collection === "shipping-areas") {
    url = getApiUrl(`/api/mysql/shipping-areas`);
    payload = { id, ...payload };
  } else if (collection === "riders") {
    url = getApiUrl(`/api/mysql/riders`);
    payload = { id, ...payload };
  } else if (collection === "analytics_events") {
    url = getApiUrl(`/api/mysql/analytics`);
    payload = { id, ...payload };
  } else if (collection === "assets") {
    url = getApiUrl(`/api/mysql/assets`);
    payload = { id, ...payload };
  }

  if (!url) {
    // Store in localStorage as transient fallback
    try {
      localStorage.setItem(`transient_collection_${collection}_${id}`, JSON.stringify(payload));
    } catch (e) {}
    return;
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Write failed: ${errText}`);
  }
}

export async function updateDoc(docRef: any, data: any): Promise<void> {
  const { collection, id } = docRef;

  let url = "";
  let method = "PUT"; // Use PUT for order updates, POST for others
  let body = data;

  if (collection === "orders") {
    url = getApiUrl(`/api/mysql/orders/${id}`);
    method = "PUT";
  } else if (collection === "users") {
    url = getApiUrl(`/api/mysql/users/${id}`);
    method = "PUT";
  } else if (collection === "riders") {
    url = getApiUrl(`/api/mysql/riders/${id}`);
    method = "PUT";
  } else {
    // Fall back to setDoc merge for other collections
    return await setDoc(docRef, data, { merge: true });
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Update failed: ${errText}`);
  }
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  const collectionName = collectionRef.name;
  const generatedId = "mysql_gen_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(collectionRef.db, collectionName, generatedId);
  await setDoc(docRef, data);
  return docRef;
}

export async function deleteDoc(docRef: any): Promise<void> {
  const { collection, id } = docRef;

  let url = "";
  if (collection === "orders") url = getApiUrl(`/api/mysql/orders/${id}`);
  else if (collection === "categories") url = getApiUrl(`/api/mysql/categories/${id}`);
  else if (collection === "menus" || collection === "menu") url = getApiUrl(`/api/mysql/menus/${id}`);
  else if (collection === "shipping_areas" || collection === "shipping-areas") url = getApiUrl(`/api/mysql/shipping-areas/${id}`);
  else if (collection === "riders") url = getApiUrl(`/api/mysql/riders/${id}`);
  else if (collection === "assets") url = getApiUrl(`/api/mysql/assets/${id}`);
  else if (collection === "users") url = getApiUrl(`/api/mysql/users/${id}`);

  if (!url) throw new Error(`Unsupported delete collection: ${collection}`);

  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Delete failed: ${errText}`);
  }
}

// Emulate real-time listeners by setting up standard background polling loops
export function onSnapshot(
  queryOrRef: any,
  callback: (snapshot: any) => void,
  onError?: (error: any) => void
) {
  let isDoc = queryOrRef.type === "doc";
  let lastDataHash = "";

  const poll = async () => {
    try {
      if (isDoc) {
        const snap = await getDoc(queryOrRef);
        const dataStr = JSON.stringify(snap.data());
        if (dataStr !== lastDataHash) {
          lastDataHash = dataStr;
          callback(snap);
        }
      } else {
        const snap = await getDocs(queryOrRef);
        // Serialize docs to compare hashes easily
        const docsData = snap.docs.map(d => d.data());
        const dataStr = JSON.stringify(docsData);
        if (dataStr !== lastDataHash) {
          lastDataHash = dataStr;
          callback(snap);
        }
      }
    } catch (err) {
      console.warn("[MySQL Firestore Snapshot Polling Error]:", err);
      if (onError) onError(err);
    }
  };

  // Run immediately
  poll();

  // Run background loop every 4 seconds to check for updates
  const intervalId = setInterval(poll, 4000);

  return () => {
    console.log("[MySQL Firestore] Unsubscribed from snapshot updates.");
    clearInterval(intervalId);
  };
}
