// Backend database administrator router targeting MySQL
import { querySql } from "./mysqlDb.js";

class CustomCollectionReference {
  constructor(private collectionName: string) {}
  
  doc(docId: string) {
    return new CustomDocumentReference(this.collectionName, docId);
  }
}

class CustomDocumentReference {
  constructor(private collectionName: string, private docId: string) {}

  async get() {
    try {
      if (this.collectionName === "settings") {
        const rows = await querySql("SELECT setting_value FROM settings WHERE setting_key = ?", [this.docId]);
        if (rows && rows.length > 0) {
          return { exists: true, data: () => JSON.parse(rows[0].setting_value) };
        }
        return { exists: false, data: () => null };
      }
      if (this.collectionName === "payments") {
        const rows = await querySql("SELECT * FROM payments WHERE orderId = ? OR id = ?", [this.docId, this.docId]);
        if (rows && rows.length > 0) {
          return { exists: true, data: () => rows[0] };
        }
        return { exists: false, data: () => null };
      }
      if (this.collectionName === "orders") {
        const rows = await querySql("SELECT * FROM orders WHERE id = ?", [this.docId]);
        if (rows && rows.length > 0) {
          const item = rows[0];
          return {
            exists: true,
            data: () => ({
              ...item,
              cartItems: typeof item.cartItems === "string" ? JSON.parse(item.cartItems) : item.cartItems
            })
          };
        }
        return { exists: false, data: () => null };
      }
    } catch (err) {
      console.warn(`[MySQL dbAdmin Mimic get] Error on ${this.collectionName}/${this.docId}:`, err);
    }
    return { exists: false, data: () => null };
  }

  async set(data: any, options?: any) {
    try {
      if (this.collectionName === "settings") {
        const valStr = JSON.stringify(data);
        await querySql(
          "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
          [this.docId, valStr]
        );
      } else if (this.collectionName === "payments") {
        const { orderId, amount, status, reference, method, currency, channel, description } = data;
        await querySql(
          `INSERT INTO payments (id, orderId, amount, status, reference, method, currency, channel, description, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [this.docId, orderId || this.docId, amount || 0, status || "pending", reference || "", method || "opay", currency || "NGN", channel || "", description || "", new Date().toISOString(), new Date().toISOString()]
        );
      } else if (this.collectionName === "orders") {
        const { customerName, email, phone, type, address, area, paymentMethod, promoCode, customNotes, cartItems, itemsCount, totalAmount, status } = data;
        const cartStr = typeof cartItems === "string" ? cartItems : JSON.stringify(cartItems || []);
        await querySql(
          `INSERT INTO orders (id, customerName, email, phone, type, address, area, paymentMethod, promoCode, customNotes, cartItems, itemsCount, totalAmount, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), updatedAt=VALUES(updatedAt)`,
          [this.docId, customerName, email, phone, type, address, area, paymentMethod, promoCode, customNotes, cartStr, itemsCount || 0, totalAmount || 0, status || "pending", new Date().toISOString(), new Date().toISOString()]
        );
      }
    } catch (err) {
      console.error(`[MySQL dbAdmin Mimic set] Error on ${this.collectionName}/${this.docId}:`, err);
    }
  }

  async update(data: any) {
    try {
      if (this.collectionName === "payments") {
        let updates: string[] = [];
        let params: any[] = [];
        for (const [k, v] of Object.entries(data)) {
          if (k === "status" || k === "updatedAt") {
            updates.push(`${k} = ?`);
            params.push(v);
          }
        }
        if (updates.length > 0) {
          params.push(this.docId);
          await querySql(`UPDATE payments SET ${updates.join(", ")} WHERE orderId = ? OR id = ?`, [...params, this.docId]);
        }
      } else if (this.collectionName === "orders") {
        let updates: string[] = [];
        let params: any[] = [];
        for (const [k, v] of Object.entries(data)) {
          if (["status", "paymentStatus", "paymentMethod", "customerName", "email", "phone", "address", "assignedRiderId", "assignedRiderName", "assignedRiderPhone", "verificationCode", "updatedAt"].includes(k)) {
            updates.push(`${k} = ?`);
            params.push(v);
          }
        }
        if (updates.length > 0) {
          params.push(this.docId);
          await querySql(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, params);
        }
      }
    } catch (err) {
      console.error(`[MySQL dbAdmin Mimic update] Error on ${this.collectionName}/${this.docId}:`, err);
    }
  }
}

export const dbAdmin = {
  collection(pathStr: string) {
    return new CustomCollectionReference(pathStr);
  }
};
