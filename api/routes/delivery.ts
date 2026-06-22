import express from "express";
import fs from "fs";
import path from "path";
import { getMailTransporter, getFromEmailAddress } from "../utils/smtp.js";

export const deliveryRouter = express.Router();

// Helper to get Firestore instance
async function getFirestoreInstance() {
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

  const { initializeApp, getApp, getApps } = await import("firebase/app");
  const { getFirestore } = await import("firebase/firestore");

  let appInstance;
  const appName = "delivery-service-app";
  const currentApps = getApps();
  if (currentApps.some(a => a.name === appName)) {
    appInstance = getApp(appName);
  } else {
    appInstance = initializeApp(firebaseConfig, appName);
  }
  return getFirestore(appInstance, databaseId);
}

// 1. GET ALL RIDERS
deliveryRouter.get("/riders", async (req, res) => {
  try {
    const db = await getFirestoreInstance();
    const { collection, getDocs } = await import("firebase/firestore");
    const snapshot = await getDocs(collection(db, "riders"));
    const riders: any[] = [];
    snapshot.forEach((docSnap) => {
      riders.push({ id: docSnap.id, ...docSnap.data() });
    });
    res.json(riders);
  } catch (err: any) {
    console.error("Error fetching riders:", err);
    res.status(500).json({ error: "Failed to fetch riders directory: " + err.message });
  }
});

// 2. CREATE A RIDER
deliveryRouter.post("/riders", async (req, res) => {
  try {
    const { fullName, phone, username, password, email } = req.body;
    if (!fullName || !phone || !username || !password) {
      return res.status(400).json({ error: "Missing required fields for rider creation." });
    }

    const db = await getFirestoreInstance();
    const { collection, getDocs, doc, setDoc } = await import("firebase/firestore");

    // Check if username already exists
    const snapshot = await getDocs(collection(db, "riders"));
    let exists = false;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if ((data.username || "").toLowerCase() === username.toLowerCase()) {
        exists = true;
      }
    });

    if (exists) {
      return res.status(400).json({ error: "Username is already registered. Please choose another Username." });
    }

    const riderId = `rider_${Date.now()}`;
    const riderPayload = {
      id: riderId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      username: username.trim(),
      password: password, // Store password securely or simple check as requested
      email: (email || "").trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "riders", riderId), riderPayload);
    res.status(201).json(riderPayload);
  } catch (err: any) {
    console.error("Error creating rider:", err);
    res.status(500).json({ error: "Failed to create rider profile: " + err.message });
  }
});

// 3. EDIT / DEACTIVATE RIDER
deliveryRouter.put("/riders/:id", async (req, res) => {
  try {
    const riderId = req.params.id;
    const { fullName, phone, password, email, active } = req.body;

    const db = await getFirestoreInstance();
    const { doc, updateDoc } = await import("firebase/firestore");

    const updatePayload: any = {};
    if (fullName !== undefined) updatePayload.fullName = fullName.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (password !== undefined) updatePayload.password = password;
    if (email !== undefined) updatePayload.email = email.trim();
    if (active !== undefined) updatePayload.active = !!active;

    await updateDoc(doc(db, "riders", riderId), updatePayload);
    res.json({ success: true, message: "Rider details updated successfully." });
  } catch (err: any) {
    console.error("Error updating rider:", err);
    res.status(500).json({ error: "Failed to update rider profile: " + err.message });
  }
});

// 4. RIDER LOGIN (strictly username and password)
deliveryRouter.post("/riders/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required." });
    }

    const db = await getFirestoreInstance();
    const { collection, getDocs } = await import("firebase/firestore");

    const snapshot = await getDocs(collection(db, "riders"));
    let foundRider: any = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        (data.username || "").toLowerCase().trim() === username.toLowerCase().trim() &&
        (data.password || "") === password
      ) {
        foundRider = { id: docSnap.id, ...data };
      }
    });

    if (!foundRider) {
      return res.status(401).json({ error: "Invalid username or password credentials." });
    }

    if (foundRider.active === false) {
      return res.status(403).json({ error: "This rider account is currently deactivated. Please contact administration." });
    }

    res.json({
      success: true,
      rider: {
        id: foundRider.id,
        fullName: foundRider.fullName,
        username: foundRider.username,
        phone: foundRider.phone,
        email: foundRider.email
      }
    });
  } catch (err: any) {
    console.error("Rider portal login error:", err);
    res.status(500).json({ error: "Failed to login rider: " + err.message });
  }
});

// 5. ASSIGN RIDER TO ORDER & SEND EMAIL
deliveryRouter.post("/orders/assign", async (req, res) => {
  try {
    const { orderId, riderId, riderName, riderPhone } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const db = await getFirestoreInstance();
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return res.status(404).json({ error: "Order not found in system." });
    }

    const orderData = orderSnap.data();
    
    // Update order with rider information
    const assignmentPayload: any = {
      assignedRiderId: riderId || null,
      assignedRiderName: riderName || null,
      assignedRiderPhone: riderPhone || null,
      status: riderId ? "Out for Delivery" : orderData.status // transition automatically to Out for Delivery if assigned
    };

    await updateDoc(orderRef, assignmentPayload);

    // If a rider is assigned and customer email exists, send assignment email!
    const customerEmail = orderData.email || "guest@example.com";
    const verificationCode = orderData.verificationCode || "N/A";

    if (riderId && customerEmail && customerEmail !== "guest@example.com" && customerEmail.includes("@")) {
      const transporter = getMailTransporter();
      if (transporter) {
        const computedFrom = getFromEmailAddress();
        const mailOptions = {
          from: computedFrom,
          to: customerEmail.trim().toLowerCase(),
          subject: `📦 Your UPSIDE Order has been Dispatched [Rider Assigned]`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Gourmet Experience is on its Way</title>
  <style>
    body { font-family: sans-serif; background-color: #fcfbf9; color: #1c1917; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e7e5e4; padding: 30px; }
    .header { text-align: center; border-bottom: 1px solid #f1f0ee; padding-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: bold; letter-spacing: 0.1em; color: #78350f; uppercase; }
    .content { padding: 25px 0; }
    .rider-card { background-color: #fdfbf7; border: 1px solid #f3ebd7; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .code-box { text-align: center; border-radius: 4px; background-color: #f5f5f4; color: #1c1917; padding: 15px; margin: 20px 0; border: 1px dashed #78350f; font-family: monospace; font-size: 18px; font-weight: bold; }
    .footer { font-size: 11px; text-align: center; color: #a8a29e; border-top: 1px solid #f1f0ee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">UPSIDE RESTAURANT & CAFÉ</div>
      <p style="font-size: 11px; color: #78350f; text-transform: uppercase; margin-top: 5px;">Sanctuary of Artisanal Gastronomy</p>
    </div>
    <div class="content">
      <h3 style="color: #1c1917;">Greetings ${orderData.customerName},</h3>
      <p>We are delighted to inform you that your gourmet order <strong>#${orderId.substring(6) || orderId}</strong> is fully prepared and has been assigned to a premium dispatch rider for immediate delivery!</p>
      
      <div class="rider-card">
        <h4 style="margin: 0 0 10px 0; color: #78350f;">🚴 YOUR ASSIGNED RIDER:</h4>
        <p style="margin: 5px 0;"><strong>Full Name:</strong> ${riderName}</p>
        <p style="margin: 5px 0;"><strong>Phone Number:</strong> <a href="tel:${riderPhone}">${riderPhone}</a></p>
      </div>

      <p>Upon rider arrival, you will need to provide them with your unique pickup/delivery verification code to claim your gourmet package:</p>
      
      <div class="code-box">
        🔑 DELIVERY VERIFICATION CODE: ${verificationCode}
      </div>

      <p style="font-size: 12px; color: #78716c; line-height: 1.5; font-style: italic;">
        Please make sure you have this 6-digit code handy when our rider reaches your sanctuary. This locks accuracy and security for your culinary service.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 UPSIDE Fine Dining & Café. A Brand of Mopheth. Lekki Phase 1, Lagos.</p>
    </div>
  </div>
</body>
</html>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log(`[RIDER ASSIGNMENT EMAIL] Successfully dispatched email to customer: ${customerEmail}`);
      }
    }

    res.json({ success: true, message: "Rider assigned and customer notification dispatched." });
  } catch (err: any) {
    console.error("Rider allocation fault:", err);
    res.status(500).json({ error: "Failed to allocate rider: " + err.message });
  }
});

// 6. ORDER RECENTLY PLACED EMAIL DISPATCH
deliveryRouter.post("/notify/order-placed", async (req, res) => {
  try {
    const { orderId, email, customerName, verificationCode, totalPrice, items, address } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ error: "Missing required details to dispatch confirmation email." });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === "guest@example.com" || !cleanEmail.includes("@")) {
      return res.json({ success: true, message: "Skipping confirmation mail: guest order." });
    }

    const parsedItems = Array.isArray(items) ? items : (typeof items === "string" ? JSON.parse(items) : []);

    const transporter = getMailTransporter();
    if (transporter) {
      const computedFrom = getFromEmailAddress();
      const itemsListHtml = parsedItems.map((it: any) => `
        <tr style="border-bottom: 1px solid #f1f0ee;">
          <td style="padding: 10px 0; font-size: 13px;">${it.name} <span style="color: #a8a29e;">x${it.quantity}</span></td>
          <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: bold;">₦${(it.price * it.quantity).toLocaleString()}</td>
        </tr>
      `).join("");

      const mailOptions = {
        from: computedFrom,
        to: cleanEmail,
        subject: `🍕 Cooking commences! Order Confirmation: #${orderId.substring(6) || orderId}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Gourmet Order Confirmation</title>
  <style>
    body { font-family: sans-serif; background-color: #fcfbf9; color: #1c1917; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e7e5e4; padding: 30px; }
    .header { text-align: center; border-bottom: 1px solid #f1f0ee; padding-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: bold; letter-spacing: 0.1em; color: #78350f; text-transform: uppercase; }
    .content { padding: 25px 0; }
    .code-box { text-align: center; border-radius: 4px; background-color: #fdfbf7; color: #b45309; padding: 20px; margin: 25px 0; border: 1px dashed #f3ebd7; font-family: monospace; font-size: 22px; font-weight: 800; letter-spacing: 0.1em; }
    .table-totals { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .footer { font-size: 11px; text-align: center; color: #a8a29e; border-top: 1px solid #f1f0ee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">UPSIDE RESTAURANT & CAFÉ</div>
      <p style="font-size: 11px; color: #78350f; text-transform: uppercase; margin-top: 5px;">Sanctuary of Artisanal Gastronomy</p>
    </div>
    <div class="content">
      <h3 style="color: #1c1917;">Greetings ${customerName},</h3>
      <p>Thank you for choosing Upside! Your order has been registered in our kitchen ledger, and our culinary chef teams are actively preparing your selection.</p>
      
      <p>Below is your secure order and pickup verification/pickup code. You will need to present this code to claim your package:</p>
      
      <div class="code-box">
        🔑 PICKUP/VERIFICATION CODE:<br/>
        <span style="font-size: 28px; display: inline-block; margin-top: 8px;">${verificationCode}</span>
      </div>

      <h4 style="border-bottom: 1px solid #f1f0ee; padding-bottom: 8px; margin-top: 30px; color: #78350f;">🛒 ORDER SUMMARY:</h4>
      <table class="table-totals">
        <thead>
          <tr style="border-bottom: 1px solid #f1f0ee; text-align: left; color: #78716c; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
            <th style="padding-bottom: 8px;">Item / Quantity</th>
            <th style="padding-bottom: 8px; text-align: right;">Price Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
          <tr>
            <td style="padding: 15px 0 5px 0; font-size: 14px; font-weight: bold;">TOTAL PRICE:</td>
            <td style="padding: 15px 0 5px 0; text-align: right; font-size: 16px; font-weight: 850; color: #78350f;">₦${totalPrice.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #fafaf9; border-left: 2px solid #78350f; padding: 12px; margin-top: 25px; font-size: 12px; color: #44403c;">
        <strong>Delivery Sanctuary Address:</strong><br/>
        ${address || "Boutique Self-Pickup at Lekki Sanctuary"}
      </div>
    </div>
    <div class="footer">
      <p>© 2026 UPSIDE Fine Dining & Café. A Brand of Mopheth. Lekki Phase 1, Lagos.</p>
    </div>
  </div>
</body>
</html>
        `
      };
      await transporter.sendMail(mailOptions);
      console.log(`[ORDER CONFIRMATION EMAIL] Successfully dispatched details to customer email: ${cleanEmail}`);
    }

    res.json({ success: true, message: "Order placed notification email sent." });
  } catch (err: any) {
    console.error("Order placed e-mail notify fault:", err);
    res.status(500).json({ error: "Failed to dispatch order placement notification email: " + err.message });
  }
});
