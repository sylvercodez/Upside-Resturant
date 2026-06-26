import express from "express";
import fs from "fs";
import path from "path";
import { getMailTransporter, getFromEmailAddress } from "../_utils/smtp.js";

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

  try {
    const fdb = getFirestore(appInstance, databaseId);
    // Test query to see if it exists
    const { collection, getDocs, limit, query } = await import("firebase/firestore");
    await getDocs(query(collection(fdb, "users"), limit(1)));
    return fdb;
  } catch (err: any) {
    console.warn(`Firestore client with DB ID ${databaseId} failed (${err.message}), falling back to default database.`);
    return getFirestore(appInstance);
  }
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

    await setDoc(doc(db, "riders", riderId), {
      ...riderPayload,
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
    });
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

    await updateDoc(doc(db, "riders", riderId), {
      ...updatePayload,
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
    });
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
      status: riderId ? "Out for Delivery" : orderData.status, // transition automatically to Out for Delivery if assigned
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
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

// 6. ORDER RECENTLY PLACED EMAIL DISPATCH & ADMIN ALERTS
deliveryRouter.post("/notify/order-placed", async (req, res) => {
  try {
    const { orderId, email, customerName, verificationCode, totalPrice, items, address, phone } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ error: "Missing required details to dispatch confirmation email." });
    }

    const cleanEmail = email.trim().toLowerCase();
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

      // A. Dispatch User Confirmation (if not guest placeholder)
      if (cleanEmail !== "guest@example.com" && cleanEmail.includes("@")) {
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
              <td style="padding: 15px 0 5px 0; text-align: right; font-size: 16px; font-weight: 850; color: #78350f;">₦${Number(totalPrice).toLocaleString()}</td>
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
        console.log(`[ORDER CONFIRMATION EMAIL] Dispatched to customer: ${cleanEmail}`);
      }

      // B. Dispatch Admin Alert immediately for a complete ERP integration
      const adminEmails = ["tosinotenaike3@gmail.com", "mophethecommerce@gmail.com"];
      const adminMailOptions = {
        from: computedFrom,
        to: adminEmails.join(", "),
        subject: `🚨 [NEW ORDER RECEIVED] Order #${orderId.substring(6) || orderId} - ₦${Number(totalPrice).toLocaleString()}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Ledger Alert</title>
  <style>
    body { font-family: monospace; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 20px; }
    .alert-card { max-width: 600px; margin: 0 auto; background-color: #1c1917; border: 2px solid #d97706; padding: 25px; border-radius: 8px; }
    .title { color: #f59e0b; font-weight: bold; font-size: 16px; border-bottom: 1px solid #44403c; padding-bottom: 10px; margin-bottom: 15px; }
    .meta-line { margin: 8px 0; font-size: 12px; }
    .meta-label { color: #a8a29e; font-weight: bold; }
    .meta-value { color: #ffffff; }
    .total { font-weight: bold; font-size: 15px; color: #10b981; border-top: 1px dashed #44403c; padding-top: 12px; margin-top: 15px; }
    .footer { text-align: center; color: #78716c; font-size: 10px; margin-top: 20px; border-top: 1px solid #292524; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="alert-card">
    <div class="title">🔔 NEW GOURMET ORDER PLACED (UPSIDE ERP ALERT)</div>
    
    <div class="meta-line">
      <span class="meta-label">ORDER REFERENCE :</span> <span class="meta-value">#${orderId}</span>
    </div>
    <div class="meta-line">
      <span class="meta-label">CUSTOMER NAME   :</span> <span class="meta-value">${customerName}</span>
    </div>
    <div class="meta-line">
      <span class="meta-label">EMAIL ADDRESS   :</span> <span class="meta-value">${email}</span>
    </div>
    <div class="meta-line">
      <span class="meta-label">PHONE NUMBER    :</span> <span class="meta-value">${phone || "N/A"}</span>
    </div>
    <div class="meta-line">
      <span class="meta-label">DELIVERY DEST.  :</span> <span class="meta-value">${address || "Boutique Self-Pickup"}</span>
    </div>
    <div class="meta-line">
      <span class="meta-label">VERIFY CODE     :</span> <span class="meta-value" style="background-color: #d97706; color: #000; padding: 1px 5px; font-weight: bold; border-radius: 3px;">${verificationCode}</span>
    </div>

    <div style="margin-top: 15px; border-top: 1px solid #44403c; padding-top: 10px;">
      <span class="meta-label">ORDERED SELECTION:</span>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
        ${parsedItems.map((it: any) => `
          <tr>
            <td style="color: #ffffff; padding: 4px 0;">- ${it.name} x${it.quantity}</td>
            <td style="color: #f59e0b; text-align: right; padding: 4px 0;">₦${(it.price * it.quantity).toLocaleString()}</td>
          </tr>
        `).join("")}
      </table>
    </div>

    <div class="total">
      TOTAL BILLABLE AMOUNT: ₦${Number(totalPrice).toLocaleString()}
    </div>

    <div class="footer">
      Upside Realtime ERP Notification Engine • Live Server Ledger Sync
    </div>
  </div>
</body>
</html>
        `
      };
      await transporter.sendMail(adminMailOptions);
      console.log(`[ERP ADMIN ALERT] Dispatched new order warning to admins.`);
    }

    res.json({ success: true, message: "Order placed notification email sent both to user and admin." });
  } catch (err: any) {
    console.error("Order placed e-mail notify fault:", err);
    res.status(500).json({ error: "Failed to dispatch order placement notification email: " + err.message });
  }
});

// 7. ORDER STATUS UPDATER (ERP WORKFLOW REDIRECT WITH NOTIFICATION TRAFFIC)
deliveryRouter.post("/orders/update-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: "Order ID and target transition status are required." });
    }

    const db = await getFirestoreInstance();
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return res.status(404).json({ error: "Order not found in firestore ledger." });
    }

    const orderData = orderSnap.data();
    const oldStatus = orderData.status || "UNKNOWN";

    // Skip update if already same status
    if (oldStatus.toLowerCase() !== status.toLowerCase()) {
      await updateDoc(orderRef, {
        status: status,
        updatedAt: new Date().toISOString(),
        systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
      });
    }

    const cleanEmail = (orderData.email || "").trim().toLowerCase();
    const customerName = orderData.customerName || "Premium Customer";
    const verificationCode = orderData.verificationCode || "N/A";
    const totalPrice = orderData.totalPrice || 0;
    const items = orderData.items || [];
    const parsedItems = Array.isArray(items) ? items : (typeof items === "string" ? JSON.parse(items) : []);
    const address = orderData.address || "Boutique Self-Pickup at Lekki Sanctuary";

    const transporter = getMailTransporter();
    if (transporter) {
      const computedFrom = getFromEmailAddress();

      // Define specialized description based on status transition
      let statusDesc = `Your order status has been successfully updated to <strong>${status}</strong>.`;
      let emailSubject = `🔔 UPSIDE Order Update: #${orderId.substring(6) || orderId} is now ${status.toUpperCase()}`;
      let accentColor = "#D97706"; // amber

      if (status.toLowerCase().includes("prepare") || status.toLowerCase().includes("prep")) {
        statusDesc = `👨‍🍳 Great news! Our Michelin-starred chefs are currently crafting your selections with pure culinary precision. Selection prep is actively underway.`;
        emailSubject = `👨‍🍳 Prep commmenced! Order #${orderId.substring(6) || orderId} is now being prepared!`;
        accentColor = "#7C2D12"; // custom deep red-orange
      } else if (status.toLowerCase().includes("out") || status.toLowerCase().includes("dispatch") || status.toLowerCase().includes("rider")) {
        statusDesc = `🚴 Fast Track! Your premium selection has left our Lekki kitchen sanctuary. A luxury dispatch rider is on the route to deliver directly to your target entrance.`;
        emailSubject = `🚴 On its way! Order #${orderId.substring(6) || orderId} is now Out for Delivery!`;
        accentColor = "#10B981"; // green
      } else if (status.toLowerCase().includes("deliver")) {
        statusDesc = `✨ Gourmet delivered! Your order has been securely checked out and delivered directly to your destination. Please enjoy local flavor at its prime. We thank you for choosing Upside!`;
        emailSubject = `✅ Savor the flavor! Order #${orderId.substring(6) || orderId} has been successfully Delivered`;
        accentColor = "#059669"; // emerald
      } else if (status.toLowerCase().includes("cancel")) {
        statusDesc = `⚠️ Please note that your order has been marked as <strong>CANCELLED</strong>. If you did not authorize this, please contact support immediately.`;
        emailSubject = `⚠️ Order Cancelled Alert: #${orderId.substring(6) || orderId}`;
        accentColor = "#EF4444"; // red
      }

      // Send User Email
      if (cleanEmail && cleanEmail !== "guest@example.com" && cleanEmail.includes("@")) {
        const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Upside Luxury Status Alert</title>
  <style>
    body { font-family: sans-serif; background-color: #fcfbf9; color: #1c1917; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e7e5e4; padding: 30px; }
    .header { text-align: center; border-bottom: 1px solid #f1f0ee; padding-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: bold; letter-spacing: 0.1em; color: #78350f; text-transform: uppercase; }
    .content { padding: 25px 0; }
    .status-badge { display: inline-block; background-color: ${accentColor}; color: #ffffff; padding: 8px 16px; font-weight: bold; font-size: 13px; text-transform: uppercase; border-radius: 4px; letter-spacing: 0.05em; margin-bottom: 20px; }
    .code-box { text-align: center; border-radius: 4px; background-color: #fcf6e8; color: #78350f; padding: 15px; margin: 20px 0; border: 1px dashed #e9d5ff; font-family: monospace; font-size: 18px; font-weight: bold; }
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
      <h3 style="color: #1c1917; margin-top: 0;">Dear ${customerName},</h3>
      
      <div class="status-badge">CURRENT STATUS: ${status.toUpperCase()}</div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #292524;">
        ${statusDesc}
      </p>

      ${status.toLowerCase().includes("out") ? `
      <div class="code-box">
        🔑 YOUR SECURE DELIVERY CODE: ${verificationCode}<br/>
        <span style="font-size: 10px; font-weight: normal; color: #78716c; max-width: 400px; display: inline-block; margin-top: 5px;">Present this 6-digit credential to your rider on package handoff.</span>
      </div>
      ` : ""}

      <p style="font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 15px; margin-top: 20px;">
        <strong>Order Ref:</strong> #${orderId.substring(6) || orderId}<br/>
        <strong>Destination Sanctuary:</strong> ${address}
      </p>
    </div>
    <div class="footer">
      <p>© 2026 UPSIDE Fine Dining & Café. Lekki Phase 1, Lagos.</p>
    </div>
  </div>
</body>
</html>
        `;

        await transporter.sendMail({
          from: computedFrom,
          to: cleanEmail,
          subject: emailSubject,
          html: userHtml
        });
        console.log(`[STATUS ACTION USER EMAIL] Sent update to ${cleanEmail}`);
      }

      // Send Admin Email
      const adminEmails = ["tosinotenaike3@gmail.com", "mophethecommerce@gmail.com"];
      const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Order Movement Log</title>
  <style>
    body { font-family: monospace; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 20px; }
    .log-card { max-width: 600px; margin: 0 auto; background-color: #1c1917; border: 1px solid #44403c; padding: 20px; border-radius: 6px; }
    .title { color: #f59e0b; border-bottom: 1px solid #44403c; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px; font-weight: bold; }
    .field { margin: 8px 0; font-size: 11px; }
    .label { color: #a8a29e; }
    .value { color: #f5f5f4; font-weight: bold; }
  </style>
</head>
<body>
  <div class="log-card">
    <div class="title">🔄 ERP ORDER STATE MOVEMENT LOG</div>
    <div class="field"><span class="label">ORDER REFERENCE :</span> <span class="value">#${orderId}</span></div>
    <div class="field"><span class="label">CUSTOMER NAME   :</span> <span class="value">${customerName}</span></div>
    <div class="field"><span class="label">FORMER STATUS   :</span> <span class="value" style="color: #ef4444; text-decoration: line-through;">${oldStatus}</span></div>
    <div class="field"><span class="label">CURRENT STATUS  :</span> <span class="value" style="color: #10b981; background-color: #064e3b; padding: 2px 6px; border-radius: 3px;">${status}</span></div>
    <div class="field"><span class="label">BILL TOTAL      :</span> <span class="value">₦${Number(totalPrice).toLocaleString()}</span></div>
    <div class="field"><span class="label">SECURITY CODE   :</span> <span class="value">${verificationCode}</span></div>
    <div class="field"><span class="label">STREET ADDRESS  :</span> <span class="value">${address}</span></div>
    <div style="font-size: 9px; text-align: center; color: #78716c; border-top: 1px solid #292524; margin-top: 15px; padding-top: 6px;">
      Upside Realtime ERP Status Tracking Logs • Sync successful
    </div>
  </div>
</body>
</html>
      `;

      await transporter.sendMail({
        from: computedFrom,
        to: adminEmails.join(", "),
        subject: `🔄 [ERP Order Log] #${orderId.substring(6) || orderId} transitioned: ${oldStatus} ➔ ${status}`,
        html: adminHtml
      });
      console.log(`[STATUS ACTION ADMIN EMAIL] Sent logs update to admins.`);
    }

    res.json({ success: true, message: `Order status successfully transitioned to ${status}.` });

  } catch (err: any) {
    console.error("Order status update notifier fault:", err);
    res.status(500).json({ error: "Failed to update order status or dispatch logs: " + err.message });
  }
});

// 8. COURIER "START TRIP" EVENT WITH REAL-TIME EMAIL TRACKING LINK ORCHESTRATION
deliveryRouter.post("/orders/start-trip", async (req, res) => {
  try {
    const { orderId, riderId, riderName, riderPhone } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required to launch trip dispatch." });
    }

    const db = await getFirestoreInstance();
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return res.status(404).json({ error: "Order not found in firestore register." });
    }

    const orderData = orderSnap.data();
    const oldStatus = orderData.status || "UNKNOWN";

    // Transition state to Out for Delivery and log trip launch indicators, with systemWriteKey for permission authorization
    await updateDoc(orderRef, {
      status: "Out for Delivery",
      tripStarted: true,
      tripStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      systemWriteKey: "f8d3c501-4be5-4841-a6ab-cb5e1d4d03e9"
    });

    const cleanEmail = (orderData.email || "").trim().toLowerCase();
    const customerName = orderData.customerName || "Premium Customer";
    const verificationCode = orderData.verificationCode || "N/A";
    const address = orderData.address || "Boutique Venue";

    const transporter = getMailTransporter();
    if (transporter) {
      const computedFrom = getFromEmailAddress();
      const origin = req.headers.origin || req.headers.referer || "https://ais-pre-sbzn5bjecas4gnypehx4a5-856555242900.europe-west2.run.app";
      const liveTrackingLink = `${origin.replace(/\/$/, "")}/track?orderId=${orderId}`;

      const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your UPSIDE Carriage has Departed!</title>
  <style>
    body { font-family: sans-serif; background-color: #fcfbf9; color: #1c1917; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e7e5e4; padding: 30px; }
    .header { text-align: center; border-bottom: 1px solid #f1f0ee; padding-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: bold; letter-spacing: 0.1em; color: #78350f; text-transform: uppercase; }
    .content { padding: 25px 0; }
    .trip-box { background-color: #fdfbf7; border: 1px solid #f3ebd7; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .cta-btn { display: inline-block; background-color: #D97706; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; text-transform: uppercase; border-radius: 4px; letter-spacing: 0.05em; text-align: center; margin: 15px auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .code-box { text-align: center; border-radius: 4px; background-color: #fcf6e8; color: #78350f; padding: 12px; margin: 20px 0; border: 1px dashed #78350f; font-family: monospace; font-size: 16px; font-weight: bold; }
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
      <h3 style="color: #1c1917; margin-top: 0;">Hello ${customerName},</h3>
      
      <p style="font-size: 14px; line-height: 1.6; color: #292524;">
        Great news! Your luxury culinary selections are securely packed and on their way. Our premium courier has just <strong>started the delivery trip</strong> to your destination and is on the move!
      </p>

      <div class="trip-box" style="text-align: center;">
        <h4 style="margin: 0 0 10px 0; color: #78350f; text-transform: uppercase; font-size: 11px; tracking: 0.1em;">🗺️ LIVE ROUTE TRACKING DISPATCH:</h4>
        <p style="font-size: 13px; color: #44403c; margin-bottom: 20px;">You can monitor the live transit movement, coordinate updates, and expected real-time position of our rider directly on the GPS Radar.</p>
        
        <a href="${liveTrackingLink}" target="_blank" class="cta-btn" style="color: #ffffff !important;">Track Rider Live Map</a>
      </div>

      <div class="code-box">
        🔑 SECURE OTP CONFIRMATION CODE: ${verificationCode}<br/>
        <span style="font-size: 10px; font-weight: normal; color: #78716c; max-width: 400px; display: inline-block; margin-top: 5px;">Provide this verification key to your rider upon arrival to hand over your package.</span>
      </div>

      ${riderName ? `
      <div style="font-size: 13px; color: #44403c; background-color: #f5f5f4; padding: 12px; margin-top: 15px; border-radius: 4px;">
        👨‍✈️ <strong>Courier Rider:</strong> ${riderName} ${riderPhone ? `(${riderPhone})` : ""}
      </div>
      ` : ""}

      <p style="font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 15px; margin-top: 20px;">
        <strong>Order Ref:</strong> #${orderId.substring(6) || orderId}<br/>
        <strong>Delivery Destination:</strong> ${address}
      </p>
    </div>
    <div class="footer">
      <p>© 2026 UPSIDE Fine Dining & Café. Lekki Phase 1, Lagos.</p>
    </div>
  </div>
</body>
</html>
      `;

      if (cleanEmail && cleanEmail !== "guest@example.com" && cleanEmail.includes("@")) {
        await transporter.sendMail({
          from: computedFrom,
          to: cleanEmail,
          subject: `🏍️ UPSIDE Trip Started: Track Your Order Live Map!`,
          html: userHtml
        });
        console.log(`[START TRIP EMAIL] Live track link dispatched to ${cleanEmail}`);
      }

      // Send log to admins
      const adminEmails = ["tosinotenaike3@gmail.com", "mophethecommerce@gmail.com"];
      const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Trip Started Alert</title>
  <style>
    body { font-family: monospace; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 20px; }
    .log-card { max-width: 600px; margin: 0 auto; background-color: #1c1917; border: 1px solid #44403c; padding: 20px; border-radius: 6px; }
    .title { color: #f59e0b; border-bottom: 1px solid #44403c; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px; font-weight: bold; }
    .field { margin: 8px 0; font-size: 11px; }
    .label { color: #a8a29e; }
    .value { color: #f5f5f4; font-weight: bold; }
  </style>
</head>
<body>
  <div class="log-card">
    <div class="title">🏍️ COURIER TRIP STARTED WORKFLOW UPDATE</div>
    <div class="field"><span class="label">ORDER REFERENCE  :</span> <span class="value">#${orderId}</span></div>
    <div class="field"><span class="label">CUSTOMER NAME    :</span> <span class="value">${customerName}</span></div>
    <div class="field"><span class="label">COURIER DISPATCH :</span> <span class="value">${riderName || "Internal Courier"}</span></div>
    <div class="field"><span class="label">LIVE TRACK LINK  :</span> <span class="value"><a href="${liveTrackingLink}" style="color: #f59e0b;">${liveTrackingLink}</a></span></div>
    <div style="font-size: 9px; text-align: center; color: #78716c; border-top: 1px solid #292524; margin-top: 15px; padding-top: 6px;">
      Upside Realtime ERP Workflow Engine • Sync successful
    </div>
  </div>
</body>
</html>
      `;

      await transporter.sendMail({
        from: computedFrom,
        to: adminEmails.join(", "),
        subject: `🏍️ [ERP Dispatch Alert] Rider ${riderName || "Courier"} started delivery trip for #${orderId.substring(6) || orderId}`,
        html: adminHtml
      });
    }

    res.json({ success: true, message: "Delivery dispatch started and tracking email with link was dispatched securely to user." });
  } catch (err: any) {
    console.error("Trip start error:", err);
    res.status(500).json({ error: "Failed to initiate delivery trip: " + err.message });
  }
});
