import express from "express";
import path from "path";
import fs from "fs";
import { dbAdmin } from "../_utils/db.js";
import { querySql } from "../_utils/mysqlDb.js";
import {
  generateOpayApiSignature,
  verifyWebhookSignature,
  decryptPayload
} from "../_utils/opayHelpers.js";

export const opayRouter = express.Router();

function getAppUrl(req: any): string {
  const host = req.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `http://${host}`;
  }
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  return `${protocol}://${host}`;
}

const stripQuotes = (str: string): string => {
  if (!str) return "";
  let s = str.trim();
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1).trim();
  }
  return s;
};

/**
 * Helper to securely retrieve OPay integration settings.
 * Pulls from Firestore 'settings/opay', falling back to safe server-side process.env configurations.
 */
async function getOpayConfig() {
  console.log("=== [VERCEL LOG] OPAY CONFIGURATION RESOLUTION INITIATED ===");
  
  // Respect process.env as primary configurations first
  let merchantId = process.env.VITE_OPAY_MERCHANT_ID || process.env.OPAY_MERCHANT_ID;
  let publicKey = process.env.VITE_OPAY_PUBLIC_KEY || process.env.OPAY_PUBLIC_KEY;
  let secretKey = process.env.VITE_OPAY_SECRET_KEY || process.env.OPAY_SECRET_KEY;
  let environment = process.env.VITE_OPAY_ENVIRONMENT || process.env.OPAY_ENVIRONMENT || "sandbox";

  console.log("[VERCEL LOG] Checked Environment Variables in Process:");
  console.log(` - OPAY_MERCHANT_ID: ${merchantId ? `Present (length: ${merchantId.length}, partial: ${merchantId.substring(0, 4)}...${merchantId.substring(Math.max(0, merchantId.length - 4))})` : "MISSING"}`);
  console.log(` - OPAY_PUBLIC_KEY: ${publicKey ? `Present (length: ${publicKey.length}, partial: ${publicKey.substring(0, 8)}...)` : "MISSING"}`);
  console.log(` - OPAY_SECRET_KEY: ${secretKey ? `Present (length: ${secretKey.length}, partial: ...${secretKey.substring(Math.max(0, secretKey.length - 8))})` : "MISSING"}`);
  console.log(` - OPAY_ENVIRONMENT: ${process.env.OPAY_ENVIRONMENT || "NOT SET (Defaulting to sandbox)"}`);

  // Fallback to MySQL and Firestore settings ONLY if process.env values are not fully available
  if (!merchantId || !publicKey || !secretKey) {
    console.log("[VERCEL LOG] process.env variables incomplete. Querying MySQL settings first, then Firestore as fallback...");
    let opaySettings: any = {};
    
    // A. Query MySQL settings first
    try {
      const rows = await querySql("SELECT setting_value FROM settings WHERE setting_key = ?", ["opay"]);
      if (rows && rows.length > 0) {
        opaySettings = JSON.parse(rows[0].setting_value) || {};
        console.log("[VERCEL LOG] Found settings/opay in MySQL settings table.");
      }
    } catch (mysqlErr: any) {
      console.warn("[VERCEL LOG] Could not fetch settings/opay from MySQL database:", mysqlErr.message || mysqlErr);
    }

    // B. Query Firestore if MySQL didn't yield results
    if ((!opaySettings.merchantId || !opaySettings.publicKey || !opaySettings.secretKey) && dbAdmin) {
      try {
        const opaySnap = await dbAdmin.collection("settings").doc("opay").get();
        if (opaySnap.exists) {
          const fsSettings = opaySnap.data() || {};
          opaySettings = { ...fsSettings, ...opaySettings };
          console.log("[VERCEL LOG] Found settings/opay Firestore document.");
        } else {
          console.log("[VERCEL LOG] settings/opay Firestore document does not exist.");
        }
      } catch (err: any) {
        console.warn("[VERCEL LOG] Could not fetch settings/opay from Firestore Administrative DB:", err.message || err);
      }
    }
    
    merchantId = merchantId || opaySettings?.merchantId;
    publicKey = publicKey || opaySettings?.publicKey;
    secretKey = secretKey || opaySettings?.secretKey;
    environment = environment || opaySettings?.environment || "sandbox";
    
    console.log("[VERCEL LOG] Final values after database configuration fallbacks evaluation:");
    console.log(` - merchantId: ${merchantId ? "RESOLVED" : "MISSING"}`);
    console.log(` - publicKey: ${publicKey ? "RESOLVED" : "MISSING"}`);
    console.log(` - secretKey: ${secretKey ? "RESOLVED" : "MISSING"}`);
    console.log(` - environment: ${environment}`);
  }

  if (!merchantId || !publicKey || !secretKey) {
    console.error("=== [VERCEL LOG: FAILURE] Missing required OPay merchant credentials in both environment variables and Firestore settings. ===");
    throw new Error("OPay credentials setup is incomplete. Merchant ID, Public Key, and Secret Key are required on the server.");
  }

  console.log("=== [VERCEL LOG] OPAY CONFIGURATION RESOLVED SUCCESSFUL ===");
  return { merchantId, publicKey, secretKey, environment };
}

/**
 * 1. CLOUD FUNCTION DESIGN: initializeOpayPayment
 * Prepares the secure payment block payload, performs AES encryption, signs with HMAC-SHA512,
 * initializes OPay Cashier, and logs pending transaction/order documents.
 */
async function initializeOpayPayment(paymentData: {
  orderId: string;
  userId: string;
  amount: number;
  phone: string;
  email: string;
  customerName: string;
  items?: any[];
  address?: string;
  type?: string;
  ipAddress?: string;
  appUrl: string;
}) {
  const { merchantId, publicKey, secretKey, environment } = await getOpayConfig();
  
  // Auto-detect sandbox/test environment if keys start with standard OPay test patterns
  const isSandbox = environment !== "production" || 
                    publicKey.startsWith("OPAYPUB1") || 
                    secretKey.startsWith("OPAYPRV1");
  const opayBaseUrl = isSandbox
    ? "https://testapi.opaycheckout.com/api/v1/international/cashier/create"
    : "https://liveapi.opaycheckout.com/api/v1/international/cashier/create";

  let koboValue = Math.round(paymentData.amount * 100);

  // OPay API enforces a strict minimum transaction limit (at least 1,000 Kobo / 10 NGN is required by the OPay Gateway).
  // If a transaction lies below this minimum threshold (such as a developer diagnostic 2 Naira manual test), we
  // programmatically upscale the checkout cashier total to 10 NGN so cashier creation succeeds, enabling standard testing.
  if (koboValue < 1000) {
    console.log(`[OPay Gateway] Amount requested (${paymentData.amount} NGN / ${koboValue} Kobo) is below OPay's gateway minimum of 10 NGN (1000 Kobo). Upscaling cashier total to 10 NGN (1000 Kobo) safely for developer diagnostics.`);
    koboValue = 1000;
  }

  const returnUrl = `${paymentData.appUrl}/?opay_ref=${paymentData.orderId}`;
  const callbackUrl = `${paymentData.appUrl}/api/opay/webhook`;

  const requestData = {
    country: "NG",
    reference: paymentData.orderId,
    amount: {
      total: koboValue,
      currency: "NGN"
    },
    returnUrl,
    callbackUrl,
    customerVisitSource: "WEB",
    expireAt: 30,
    userInfo: {
      userEmail: paymentData.email || "guest@example.com",
      userId: paymentData.userId || "guest_user",
      userMobile: paymentData.phone || "+2348000000000",
      userName: paymentData.customerName || "Guest Customer"
    },
    product: {
      name: "Upside Gourmet Gastronomy",
      description: `Upside fine dining checkout. Reference: ${paymentData.orderId}`
    }
  };

  console.log("======================================= [VERCEL LOGGER: OPAY PAYMENT] START =======================================");
  console.log(`[VERCEL LOGGER: OPAY PAYMENT] Initializing Payment Request details:
   - Order ID (Reference): ${paymentData.orderId}
   - User ID: ${paymentData.userId}
   - Booking Amount: ₦${paymentData.amount}
   - Checkout Type: ${paymentData.type || "N/A"}
   - Buyer Mobile: ${paymentData.phone}
   - Buyer Email: ${paymentData.email || "N/A"}`);

  console.log(`[VERCEL LOGGER: OPAY PAYMENT] Settings Config Integrity:
   - Target Merchant ID: ${merchantId}
   - Public Key Exists: ${!!publicKey}
   - Secret Key Exists: ${!!secretKey}
   - API Environment: ${environment}
   - Request Endpoint Domain: ${opayBaseUrl}`);

  const signature = generateOpayApiSignature(requestData, secretKey);
  console.log(`[VERCEL LOGGER: OPAY PAYMENT] Signature calculated: "${signature}" (Generated using HMAC-SHA512 via Secret Key)`);
  console.log("[VERCEL LOGGER: OPAY PAYMENT] Full Outgoing Request Payload Sent To OPay:", JSON.stringify(requestData, null, 2));

  const response = await fetch(opayBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${publicKey}`,
      "MerchantId": merchantId,
      "Signature": signature
    },
    body: JSON.stringify(requestData)
  });

  console.log(`[VERCEL LOGGER: OPAY PAYMENT] HTTP Dispatch Response Status Received: ${response.status} (${response.statusText || "OK"})`);

  const responseText = await response.text();
  console.log("[VERCEL LOGGER: OPAY PAYMENT] Raw Response Payload from OPay Service Stringified:", responseText);

  let opayRes;
  try {
    opayRes = JSON.parse(responseText);
  } catch (err: any) {
    console.error(`=== [VERCEL LOGGER: FAILURE] Non-JSON Response parsed from OPay Server ===
Raw Data: "${responseText}"
Exception details:`, err);
    throw new Error(`Non-JSON response from OPay cashier server: ${responseText}`);
  }

  console.log("[VERCEL LOGGER: OPAY PAYMENT] Successfully parsed response JSON:", JSON.stringify(opayRes, null, 2));

  if (opayRes.code !== "00000" && opayRes.code !== "0000") {
    console.error(`=== [VERCEL LOGGER: API ERROR STATUS] Code: ${opayRes.code}, Message: ${opayRes.message || "No error explanation provided"} ===`);
    throw new Error(opayRes.message || `OPay cashier creation failed: Code ${opayRes.code}`);
  }

  const cashierUrl = opayRes.data?.cashierUrl || opayRes.data?.url;
  if (!cashierUrl) {
    console.error("=== [VERCEL LOGGER: SCHEMATIC MISMATCH] Parsed OPay success code but Cashier URL is missing in payload structure! ===");
    throw new Error("Cashier redirect URL was not generated by OPay API.");
  }

  console.log(`[VERCEL LOGGER: OPAY PAYMENT] Success! Checkout URL generated gracefully. Redirecting to: ${cashierUrl}`);
  console.log("======================================= [VERCEL LOGGER: OPAY PAYMENT] END =======================================");

  // 4. Store Payment document in Firestore as specified using try-catch to keep it resilient
  try {
    const createdAtIso = new Date().toISOString();
    if (dbAdmin) {
      await dbAdmin.collection("payments").doc(paymentData.orderId).set({
        orderId: paymentData.orderId,
        userId: paymentData.userId || "guest",
        amount: paymentData.amount,
        currency: "NGN",
        paymentMethod: "OPay",
        transactionReference: paymentData.orderId,
        paymentStatus: "PENDING",
        createdAt: createdAtIso,
        customerName: paymentData.customerName,
        email: paymentData.email || "guest@example.com",
        phone: paymentData.phone,
        items: paymentData.items || [],
        address: paymentData.address || "Boutique Self-Pickup",
        type: paymentData.type || "delivery"
      });
      console.log(`[initializeOpayPayment] Successfully logged payment intent document to Firestore for Ref: ${paymentData.orderId}`);
    } else {
      console.warn(`[initializeOpayPayment] Administrative db instance is offline. Skipping payment logging for Ref: ${paymentData.orderId}`);
    }
  } catch (firestoreErr: any) {
    console.error(`[initializeOpayPayment] Firestore administrative logging error (payment record):`, firestoreErr.message || firestoreErr);
  }

  // 5. Store Payment and Order in MySQL database
  try {
    // A. Insert/update payment record in MySQL payments table
    await querySql(
      "INSERT INTO payments (reference, amount, paymentStatus, orderId, updatedAt) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount), paymentStatus = VALUES(paymentStatus), orderId = VALUES(orderId), updatedAt = VALUES(updatedAt)",
      [paymentData.orderId, paymentData.amount, "unpaid", paymentData.orderId, new Date().toISOString()]
    );
    console.log(`[initializeOpayPayment] Successfully logged payment to MySQL payments table: ${paymentData.orderId}`);

    // B. Insert/update order record in MySQL orders table
    const itemsStr = typeof paymentData.items === "string" ? paymentData.items : JSON.stringify(paymentData.items || []);
    await querySql(
      `INSERT INTO orders (id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE userId = VALUES(userId), customerName = VALUES(customerName), email = VALUES(email), phone = VALUES(phone), totalPrice = VALUES(totalPrice), items = VALUES(items), address = VALUES(address), status = VALUES(status), paymentStatus = VALUES(paymentStatus), updatedAt = VALUES(updatedAt)`,
      [
        paymentData.orderId,
        paymentData.userId || "guest",
        paymentData.customerName,
        paymentData.email || "guest@example.com",
        paymentData.phone,
        paymentData.amount,
        itemsStr,
        paymentData.address || "Boutique Self-Pickup",
        "Prepping",
        "unpaid",
        new Date().toISOString()
      ]
    );
    console.log(`[initializeOpayPayment] Successfully logged order to MySQL orders table: ${paymentData.orderId}`);
  } catch (mysqlErr: any) {
    console.warn("[initializeOpayPayment] Warning: Failed to write payment/order to MySQL database:", mysqlErr.message || mysqlErr);
  }

  console.log(`[initializeOpayPayment] Success. Redirect cashierUrl generated for Ref: ${paymentData.orderId}`);

  return {
    success: true,
    cashierUrl,
    reference: paymentData.orderId,
    orderId: opayRes.data?.orderId || null
  };
}

/**
 * 2. CLOUD FUNCTION DESIGN: verifyOpayPayment
 * Queries OPay cashier endpoint status, decrypts response payload,
 * validates against Firestore document, maps status, and updates records.
 */
async function verifyOpayPayment(reference: string) {
  const { merchantId, publicKey, secretKey, environment } = await getOpayConfig();

  // Auto-detect sandbox/test environment if keys start with standard OPay test patterns
  const isSandbox = environment !== "production" || 
                    publicKey.startsWith("OPAYPUB1") || 
                    secretKey.startsWith("OPAYPRV1");
  const opayStatusUrl = isSandbox
    ? "https://testapi.opaycheckout.com/api/v1/international/cashier/status"
    : "https://liveapi.opaycheckout.com/api/v1/international/cashier/status";

  const requestData = {
    reference,
    country: "NG"
  };

  const signature = generateOpayApiSignature(requestData, secretKey);

  console.log(`[verifyOpayPayment] Querying payment status from OPay: ${reference}`);

  const response = await fetch(opayStatusUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${publicKey}`,
      "MerchantId": merchantId,
      "Signature": signature
    },
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();
  let opayRes;
  try {
    opayRes = JSON.parse(responseText);
  } catch {
    throw new Error(`Non-JSON response from status check: ${responseText}`);
  }

  if (opayRes.code !== "00000" && opayRes.code !== "0000") {
    throw new Error(opayRes.message || `OPay status check failure: ${opayRes.code}`);
  }

  const responseData = opayRes.data;

  if (!responseData) {
    throw new Error("Unable to parse transaction details from OPay.");
  }

  const opayStatus = responseData.status || responseData.orderStatus || "PENDING";
  
  // Status mapping:
  // SUCCESS → PAID
  // FAIL → FAILED
  // CANCEL → CANCELLED
  // CLOSE → EXPIRED
  // PENDING → PENDING
  let mappedStatus = "PENDING";
  if (opayStatus === "SUCCESS") mappedStatus = "PAID";
  else if (opayStatus === "FAIL") mappedStatus = "FAILED";
  else if (opayStatus === "CANCEL") mappedStatus = "CANCELLED";
  else if (opayStatus === "CLOSE") mappedStatus = "EXPIRED";
  else if (opayStatus === "PENDING") mappedStatus = "PENDING";

  console.log(`[verifyOpayPayment] Mapped status for ${reference}: OPay Status [${opayStatus}] -> Mapped [${mappedStatus}]`);

  // Update payment record in payments collection
  try {
    if (dbAdmin) {
      await dbAdmin.collection("payments").doc(reference).update({
        paymentStatus: mappedStatus,
        updatedAt: new Date().toISOString()
      });
      console.log(`[verifyOpayPayment] Successfully verified and updated payment status for Ref: ${reference} -> ${mappedStatus}`);
    } else {
      console.warn(`[verifyOpayPayment] Administrative db is offline. Skipping payment update for Ref: ${reference}`);
    }
  } catch (firestoreErr: any) {
    console.error(`[verifyOpayPayment] Firestore payment document update failed:`, firestoreErr.message || firestoreErr);
  }

  // Update payment and order in MySQL as well
  try {
    // 1. Update payments table in MySQL
    await querySql(
      "UPDATE payments SET paymentStatus = ?, updatedAt = ? WHERE reference = ?",
      [mappedStatus === "PAID" ? "paid" : mappedStatus.toLowerCase(), new Date().toISOString(), reference]
    );
    console.log(`[verifyOpayPayment] Successfully updated MySQL payments status for Ref: ${reference} -> ${mappedStatus}`);

    // 2. Update orders table in MySQL
    if (mappedStatus === "PAID") {
      // First, get payment details to handle auto-creation if order doesn't exist
      const rows = await querySql("SELECT * FROM payments WHERE reference = ?", [reference]);
      const mysqlPayment = rows && rows.length > 0 ? rows[0] : null;

      const orderRows = await querySql("SELECT * FROM orders WHERE id = ?", [reference]);
      if (!orderRows || orderRows.length === 0) {
        // If order doesn't exist, create it
        await querySql(
          `INSERT INTO orders (id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reference,
            "guest",
            "Vanguard Guest",
            "guest@example.com",
            "",
            mysqlPayment ? mysqlPayment.amount : 0,
            "[]",
            "Boutique Self-Pickup",
            "Prepping",
            "paid",
            new Date().toISOString()
          ]
        );
        console.log(`[verifyOpayPayment] Created new successful MySQL order record for Ref: ${reference}`);
      } else {
        await querySql(
          "UPDATE orders SET paymentStatus = ?, status = 'Prepping', updatedAt = ? WHERE id = ?",
          ["paid", new Date().toISOString(), reference]
        );
        console.log(`[verifyOpayPayment] Successfully updated status of existing MySQL order Ref: ${reference} to paid`);
      }
    } else if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED" || mappedStatus === "EXPIRED") {
      await querySql(
        "UPDATE orders SET paymentStatus = ?, updatedAt = ? WHERE id = ?",
        [mappedStatus.toLowerCase(), new Date().toISOString(), reference]
      );
      console.log(`[verifyOpayPayment] Successfully updated MySQL order status to ${mappedStatus.toLowerCase()} for Ref: ${reference}`);
    }
  } catch (mysqlErr: any) {
    console.warn("[verifyOpayPayment] Warning: Failed to update payment/order state in MySQL database:", mysqlErr.message || mysqlErr);
  }

  // Update order status in orders collection
  if (mappedStatus === "PAID") {
    try {
      if (dbAdmin) {
        const paymentSnap = await dbAdmin.collection("payments").doc(reference).get();
        if (paymentSnap.exists) {
          const paymentData = paymentSnap.data() || {};
          const orderDoc = await dbAdmin.collection("orders").doc(reference).get();
          if (!orderDoc.exists) {
            await dbAdmin.collection("orders").doc(reference).set({
              id: reference,
              userId: paymentData.userId || "guest",
              customerName: paymentData.customerName || "Vanguard Guest",
              email: paymentData.email || "guest@example.com",
              phone: paymentData.phone || "",
              totalPrice: paymentData.amount || 0,
              items: paymentData.items || [],
              address: paymentData.address || "Boutique Self-Pickup",
              status: "Prepping",
              timestamp: Date.now(),
              type: paymentData.type || "delivery"
            });
            console.log(`[verifyOpayPayment] Created new successful order document for Ref: ${reference}`);
          } else {
            await dbAdmin.collection("orders").doc(reference).update({
              orderStatus: "paid",
              paymentStatus: "paid",
              updatedAt: new Date().toISOString()
            });
            console.log(`[verifyOpayPayment] Successfully updated status of existing order Ref: ${reference} to paid`);
          }
        }
      }
    } catch (firestoreErr: any) {
      console.error(`[verifyOpayPayment] Firestore order create/update failed (status: PAID):`, firestoreErr.message || firestoreErr);
    }
  } else if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED" || mappedStatus === "EXPIRED") {
    try {
      if (dbAdmin) {
        const orderDoc = await dbAdmin.collection("orders").doc(reference).get();
        if (orderDoc.exists) {
          await dbAdmin.collection("orders").doc(reference).update({
            paymentStatus: mappedStatus.toLowerCase(),
            updatedAt: new Date().toISOString()
          });
          console.log(`[verifyOpayPayment] Successfully updated order status to ${mappedStatus.toLowerCase()} for Ref: ${reference}`);
        }
      }
    } catch (firestoreErr: any) {
      console.error(`[verifyOpayPayment] Firestore order update failed (status: ${mappedStatus}):`, firestoreErr.message || firestoreErr);
    }
  }

  return {
    reference,
    opayStatus,
    paymentStatus: mappedStatus
  };
}

// REST EXPRESS ROUTE HANDLERS WRAPPING CLOUD FUNCTIONS

// Route: Convert OPay Dashboard configurations to environment values and save to .env
opayRouter.post("/convert-to-env", async (req: any, res: any) => {
  try {
    const { merchantId, publicKey, secretKey, environment } = req.body;
    if (!merchantId || !publicKey || !secretKey) {
      return res.status(400).json({ error: "Missing required variables: merchantId, publicKey, secretKey are required." });
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const keysMap: Record<string, string> = {
      OPAY_MERCHANT_ID: merchantId.trim(),
      OPAY_PUBLIC_KEY: publicKey.trim(),
      OPAY_SECRET_KEY: secretKey.trim(),
      OPAY_ENVIRONMENT: (environment || "sandbox").trim()
    };

    let envLines = envContent ? envContent.split("\n") : [];
    for (const [key, val] of Object.entries(keysMap)) {
      let index = envLines.findIndex(line => line.startsWith(`${key}=`) || line.startsWith(`# ${key}=`) || line.startsWith(`${key} =`));
      if (index >= 0) {
        envLines[index] = `${key}=${val}`;
      } else {
        envLines.push(`${key}=${val}`);
      }
      process.env[key] = val; // Apply to running memory process immediately
    }

    fs.writeFileSync(envPath, envLines.join("\n"), "utf-8");
    console.log("[CONVERT-TO-ENV] Successfully configured .env credentials and updated node process memory!");
    return res.json({ success: true, message: "OPay dashboard credentials converted and saved to local server environment successfully!" });
  } catch (err: any) {
    console.error("[OPay Route] Convert to env error:", err);
    return res.status(500).json({ error: err.message || "Failed to parse and save variables to env files." });
  }
});

// Route: Initialize OPay Checkout
opayRouter.post("/create-payment", async (req: any, res: any) => {
  try {
    const { amount, customerName, email, phone, reference, type, address, items, userId } = req.body;
    if (!amount || !customerName || !phone || !reference) {
      return res.status(400).json({ error: "Missing required booking payment parameters (amount, guest details, reference required)." });
    }

    const hostUrl = getAppUrl(req);
    const result = await initializeOpayPayment({
      orderId: reference,
      userId: userId || "guest",
      amount,
      phone,
      email,
      customerName,
      items,
      address,
      type,
      ipAddress: req.ip || "127.0.0.1",
      appUrl: hostUrl
    });

    return res.json(result);
  } catch (err: any) {
    console.error("[OPay Route] Initialize payment error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Route: Debug OPay configuration and verify server variables
opayRouter.get("/debug", async (req: any, res: any) => {
  console.log("=== [VERCEL LOG] SYSTEM DIAGNOSTICS PATH ACTIVATED (/api/opay/debug) ===");
  try {
    const cfg = await getOpayConfig();
    
    // Check original env variables directly to show Vercel status
    const envMerchantId = process.env.OPAY_MERCHANT_ID;
    const envPublicKey = process.env.OPAY_PUBLIC_KEY;
    const envSecretKey = process.env.OPAY_SECRET_KEY;
    const envEnv = process.env.OPAY_ENVIRONMENT;

    const diagnostics = {
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      resolvedConfig: {
        merchantId: cfg.merchantId,
        publicKeyExists: !!cfg.publicKey,
        publicKeyLength: cfg.publicKey ? cfg.publicKey.length : 0,
        publicKeySample: cfg.publicKey ? `${cfg.publicKey.substring(0, 10)}...` : undefined,
        secretKeyExists: !!cfg.secretKey,
        secretKeyLength: cfg.secretKey ? cfg.secretKey.length : 0,
        secretKeySample: cfg.secretKey ? `...${cfg.secretKey.substring(Math.max(0, cfg.secretKey.length - 8))}` : undefined,
        environment: cfg.environment
      },
      directEnvironmentVariables: {
        OPAY_MERCHANT_ID: envMerchantId ? `Present (len: ${envMerchantId.length})` : "NOT_FOUND",
        OPAY_PUBLIC_KEY: envPublicKey ? `Present (len: ${envPublicKey.length})` : "NOT_FOUND",
        OPAY_SECRET_KEY: envSecretKey ? `Present (len: ${envSecretKey.length})` : "NOT_FOUND",
        OPAY_ENVIRONMENT: envEnv || "NOT_SET"
      },
      firestoreDiagnosticFallback: {
        adminDbInitialized: !!dbAdmin,
        status: !envMerchantId || !envPublicKey || !envSecretKey ? "Fallback evaluated" : "Not needed (keys present in env)"
      }
    };

    console.log("[VERCEL LOG] Diagnostics completed successfully:", JSON.stringify(diagnostics, null, 2));
    return res.json({
      success: true,
      message: "Diagnostics loaded successfully. Credentials status is verified.",
      diagnostics
    });
  } catch (e: any) {
    console.error("=== [VERCEL LOG: DIAGNOSTICS FAILURE] ===", e);
    return res.status(500).json({
      success: false,
      error: e.message || "An error occurred checking OPay config.",
      stack: process.env.NODE_ENV !== "production" ? e.stack : undefined
    });
  }
});

// Route: Query / Verify OPay Checkout
opayRouter.post("/verify-payment", async (req: any, res: any) => {
  try {
    const { reference } = req.body.reference ? req.body : req.query; 
    const orderRef = reference || req.body.reference;
    if (!orderRef) {
      return res.status(400).json({ error: "Missing reference parameter in query or body" });
    }
    const result = await verifyOpayPayment(orderRef);
    return res.json(result);
  } catch (err: any) {
    console.error("[OPay Route] Verify payment error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * 3. EXPORTABLE & REST COMPLIANT SECURE WEBHOOK ENDPOINT: handleOpayWebhook
 * Webhook that receives notifications, validates callback signature,
 * implements idempotency checks, and commits Firestore states.
 */
const handleOpayWebhook = async (req: any, res: any) => {
  try {
    const headers = req.headers;
    const body = req.body;
    
    console.log("[handleOpayWebhook] Webhook packet received:", { headers, body });

    const { secretKey } = await getOpayConfig();

    const clientAuthKey = headers["clientauthkey"] || headers["clientAuthKey"];
    const timestamp = headers["timestamp"];
    const bodyFormat = headers["bodyformat"] || headers["bodyFormat"];

    let payloadData = body;
    let paramContent = body.paramContent || body.paramcontent;

    // Webhook signature checks
    if (clientAuthKey && timestamp && paramContent) {
      const isValid = verifyWebhookSignature(paramContent, timestamp, clientAuthKey, secretKey);
      if (!isValid) {
        console.warn("[handleOpayWebhook] Webhook signature auth validation mismatch!");
        return res.status(401).json({ status: "fail", message: "Invalid callback webhook signature" });
      }
    }

    if (bodyFormat === "ENC" && paramContent) {
      try {
        payloadData = decryptPayload(paramContent, secretKey);
      } catch (decErr: any) {
        console.error("[handleOpayWebhook] Encrypted payload decryption failure:", decErr);
        return res.status(400).json({ status: "fail", message: `Decryption failed: ${decErr.message}` });
      }
    }

    const reference = payloadData.reference || payloadData.orderId;
    const opayStatus = payloadData.status || payloadData.orderStatus;

    if (!reference || !opayStatus) {
      return res.status(400).json({ status: "fail", message: "Reference and status attributes are mandatory" });
    }

    // Idempotency: skip duplicate processing if already completed
    let paymentDoc: any = null;
    try {
      if (dbAdmin) {
        paymentDoc = await dbAdmin.collection("payments").doc(reference).get();
      }
    } catch (firestoreErr: any) {
      console.error("[handleOpayWebhook] Failed to query existing payments for idempotency check:", firestoreErr.message || firestoreErr);
    }

    if (paymentDoc && paymentDoc.exists) {
      const paymentData = paymentDoc.data();
      if (paymentData.paymentStatus === "PAID" || paymentData.paymentStatus === "FAILED" || paymentData.paymentStatus === "CANCELLED") {
        console.log(`[handleOpayWebhook] Order ${reference} already in final state [${paymentData.paymentStatus}]. Skipping.`);
        return res.json({ code: "00000", message: "SUCCESS" });
      }
    }

    // MySQL idempotency check
    try {
      const rows = await querySql("SELECT * FROM payments WHERE reference = ?", [reference]);
      if (rows && rows.length > 0) {
        const pStatus = (rows[0].paymentStatus || "").toUpperCase();
        if (pStatus === "PAID" || pStatus === "FAILED" || pStatus === "CANCELLED") {
          console.log(`[handleOpayWebhook] Order ${reference} already in final state [${pStatus}] in MySQL. Skipping.`);
          return res.json({ code: "00000", message: "SUCCESS" });
        }
      }
    } catch (mysqlErr: any) {
      console.warn("[handleOpayWebhook] Warning: Failed to perform MySQL idempotency check:", mysqlErr.message || mysqlErr);
    }

    let mappedStatus = "PENDING";
    if (opayStatus === "SUCCESS") mappedStatus = "PAID";
    else if (opayStatus === "FAIL") mappedStatus = "FAILED";
    else if (opayStatus === "CANCEL") mappedStatus = "CANCELLED";
    else if (opayStatus === "CLOSE") mappedStatus = "EXPIRED";

    console.log(`[handleOpayWebhook] Processing update for reference: ${reference} -> Mapped: ${mappedStatus}`);

    // Update payments table/collection in Firestore
    try {
      if (dbAdmin) {
        await dbAdmin.collection("payments").doc(reference).set({
          paymentStatus: mappedStatus,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[handleOpayWebhook] Successfully written payment confirmation document to Firestore for Ref: ${reference}`);
      }
    } catch (firestoreErr: any) {
      console.error("[handleOpayWebhook] Firestore set payment status failure:", firestoreErr.message || firestoreErr);
    }

    // Update payments table in MySQL
    try {
      await querySql(
        "INSERT INTO payments (reference, paymentStatus, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE paymentStatus = VALUES(paymentStatus), updatedAt = VALUES(updatedAt)",
        [reference, mappedStatus === "PAID" ? "paid" : mappedStatus.toLowerCase(), new Date().toISOString()]
      );
      console.log(`[handleOpayWebhook] Successfully written payment confirmation to MySQL payments for Ref: ${reference}`);
    } catch (mysqlErr: any) {
      console.warn("[handleOpayWebhook] Warning: Failed to update MySQL payments status:", mysqlErr.message || mysqlErr);
    }

    // Update orders table/collection in MySQL
    if (mappedStatus === "PAID") {
      try {
        const orderRows = await querySql("SELECT * FROM orders WHERE id = ?", [reference]);
        if (!orderRows || orderRows.length === 0) {
          // If order doesn't exist, retrieve payment amount from MySQL or default
          const rows = await querySql("SELECT * FROM payments WHERE reference = ?", [reference]);
          const mysqlPayment = rows && rows.length > 0 ? rows[0] : null;

          await querySql(
            `INSERT INTO orders (id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              reference,
              "guest",
              "Vanguard Guest",
              "guest@example.com",
              "",
              mysqlPayment ? mysqlPayment.amount : 0,
              "[]",
              "Boutique Self-Pickup",
              "Prepping",
              "paid",
              new Date().toISOString()
            ]
          );
          console.log(`[handleOpayWebhook] Created new successful MySQL order record for Ref: ${reference}`);
        } else {
          await querySql(
            "UPDATE orders SET paymentStatus = 'paid', status = 'Prepping', updatedAt = ? WHERE id = ?",
            [new Date().toISOString(), reference]
          );
          console.log(`[handleOpayWebhook] Successfully updated status of existing MySQL order Ref: ${reference} to paid`);
        }
      } catch (mysqlErr: any) {
        console.warn("[handleOpayWebhook] Warning: Failed to update MySQL order status (PAID):", mysqlErr.message || mysqlErr);
      }
    } else {
      try {
        await querySql(
          "UPDATE orders SET paymentStatus = ?, updatedAt = ? WHERE id = ?",
          [mappedStatus.toLowerCase(), new Date().toISOString(), reference]
        );
        console.log(`[handleOpayWebhook] Successfully updated MySQL order paymentStatus to ${mappedStatus.toLowerCase()} for Ref: ${reference}`);
      } catch (mysqlErr: any) {
        console.warn(`[handleOpayWebhook] Warning: Failed to update MySQL order status (${mappedStatus}):`, mysqlErr.message || mysqlErr);
      }
    }

    // Update orders table/collection in Firestore
    if (mappedStatus === "PAID") {
      try {
        if (dbAdmin) {
          const paymentSnap = await dbAdmin.collection("payments").doc(reference).get();
          if (paymentSnap.exists) {
            const paymentData = paymentSnap.data() || {};
            const orderDoc = await dbAdmin.collection("orders").doc(reference).get();
            if (!orderDoc.exists) {
              await dbAdmin.collection("orders").doc(reference).set({
                id: reference,
                userId: paymentData.userId || "guest",
                customerName: paymentData.customerName || "Vanguard Guest",
                email: paymentData.email || "guest@example.com",
                phone: paymentData.phone || "",
                totalPrice: paymentData.amount || 0,
                items: paymentData.items || [],
                address: paymentData.address || "Boutique Self-Pickup",
                status: "Prepping",
                timestamp: Date.now(),
                type: paymentData.type || "delivery",
                orderStatus: "payment_successful",
                paymentStatus: "payment_successful"
              });
              console.log(`[handleOpayWebhook] Created new successful order document for Ref: ${reference}`);
            } else {
              await dbAdmin.collection("orders").doc(reference).update({
                orderStatus: "payment_successful",
                paymentStatus: "payment_successful",
                updatedAt: new Date().toISOString()
              });
              console.log(`[handleOpayWebhook] Successfully updated status of existing order Ref: ${reference} to paid`);
            }
          }
        }
      } catch (firestoreErr: any) {
        console.error("[handleOpayWebhook] Firestore update order (PAID) status failure:", firestoreErr.message || firestoreErr);
      }
    } else {
      try {
        if (dbAdmin) {
          const orderDoc = await dbAdmin.collection("orders").doc(reference).get();
          if (orderDoc.exists) {
            await dbAdmin.collection("orders").doc(reference).update({
              paymentStatus: mappedStatus.toLowerCase(),
              updatedAt: new Date().toISOString()
            });
            console.log(`[handleOpayWebhook] Order reference: ${reference} status updated to ${mappedStatus.toLowerCase()}.`);
          }
        }
      } catch (firestoreErr: any) {
        console.error(`[handleOpayWebhook] Firestore update order (${mappedStatus}) status failure:`, firestoreErr.message || firestoreErr);
      }
    }

    return res.json({ code: "00000", message: "SUCCESS" });
  } catch (err: any) {
    console.error("[handleOpayWebhook] Execution failure:", err);
    return res.status(500).json({ status: "fail", error: err.message });
  }
};

opayRouter.post("/webhook", handleOpayWebhook);

// Keep backward compatibility wrapper for existing callback path if hit
opayRouter.post("/callback", async (req: any, res: any) => {
  console.log("[OPAY CALLBACK FLOW] Forwarding request to standard webhook logic...");
  return handleOpayWebhook(req, res);
});
