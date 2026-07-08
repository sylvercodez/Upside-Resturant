import express from "express";
import { getMailTransporter, getFromEmailAddress } from "../_utils/smtp.js";
import { doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

export const bookingRouter = express.Router();

// Helper to get Firestore instance (similar to instagram.ts)
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
  const appName = "booking-service-app";
  const currentApps = getApps();
  if (currentApps.some(a => a.name === appName)) {
    appInstance = getApp(appName);
  } else {
    appInstance = initializeApp(firebaseConfig, appName);
  }

  try {
    return getFirestore(appInstance, databaseId);
  } catch (err: any) {
    console.warn(`Firestore client with DB ID ${databaseId} failed (${err.message}), falling back to default database.`);
    return getFirestore(appInstance);
  }
}

bookingRouter.post("/create", async (req, res) => {
  try {
    const { name, email, phone, date, time, guests, seatingArea, specialOccasion, specialRequests } = req.body || {};
    
    if (!name || !email || !phone || !date || !time || !guests) {
      return res.status(400).json({ error: "Missing required booking fields." });
    }

    const bookingId = "bk_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);

    // Save to Firestore
    try {
      const db = await getFirestoreInstance();
      const { doc, setDoc } = await import("firebase/firestore");
      const bookingDocRef = doc(db, "bookings", bookingId);
      
      await setDoc(bookingDocRef, {
        id: bookingId,
        name,
        email,
        phone,
        date,
        time,
        guests: parseInt(guests, 10) || 2,
        seatingArea: seatingArea || "Standard",
        specialOccasion: specialOccasion || "",
        specialRequests: specialRequests || "",
        createdAt: new Date().toISOString()
      });
      console.log(`[BOOKING SYSTEM] Saved booking ${bookingId} to Firestore.`);
    } catch (dbErr: any) {
      console.error("[BOOKING SYSTEM] Firestore storage write failed:", dbErr.message);
    }

    // Try sending email via nodemailer SMTP or Resend
    let emailSent = false;
    let emailError = "";

    const mailOptions = {
      from: getFromEmailAddress(),
      to: ["hello@mophethonline.com", "mophethecommerce@gmail.com"],
      subject: `[UPSIDE BOOKING] New Table Reservation - ${name}`,
      text: `New Table Reservation Details:\n\n` +
            `Booking ID: ${bookingId}\n` +
            `Host Name: ${name}\n` +
            `Email: ${email}\n` +
            `Phone: ${phone}\n` +
            `Date: ${date}\n` +
            `Time: ${time}\n` +
            `Guests: ${guests}\n` +
            `Seating Area: ${seatingArea || 'Standard'}\n` +
            `Special Occasion: ${specialOccasion || 'None'}\n` +
            `Special Requests: ${specialRequests || 'None'}\n`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; background-color: #fbfbfb; color: #111; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #eee; padding: 30px; border-top: 4px solid #b45309; }
            h2 { color: #b45309; font-size: 20px; margin-top: 0; }
            .field { margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: bold; color: #555; display: inline-block; width: 150px; }
            .value { color: #000; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>New Table Reservation Received</h2>
            <p>A new luxury table booking has been placed on Upside Restaurant & Café website.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <div class="field"><span class="label">Booking ID:</span> <span class="value">${bookingId}</span></div>
            <div class="field"><span class="label">Host Name:</span> <span class="value">${name}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">${email}</span></div>
            <div class="field"><span class="label">Phone:</span> <span class="value">${phone}</span></div>
            <div class="field"><span class="label">Date:</span> <span class="value">${date}</span></div>
            <div class="field"><span class="label">Time:</span> <span class="value">${time}</span></div>
            <div class="field"><span class="label">Guests:</span> <span class="value">${guests}</span></div>
            <div class="field"><span class="label">Seating Area:</span> <span class="value">${seatingArea || 'Standard'}</span></div>
            <div class="field"><span class="label">Special Occasion:</span> <span class="value">${specialOccasion || 'None'}</span></div>
            <div class="field"><span class="label">Special Requests:</span> <span class="value">${specialRequests || 'None'}</span></div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`\n=================================================`);
    console.log(`[TABLE BOOKING DIRECT EMAIL DISPATCH]`);
    console.log(`To: hello@mophethonline.com & mophethecommerce@gmail.com`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Details: Date: ${date}, Time: ${time}, Guests: ${guests}, Host: ${name}`);
    console.log(`=================================================\n`);

    try {
      const transporter = getMailTransporter();
      if (transporter) {
        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("[BOOKING SYSTEM] Email successfully sent via transporter.");
      } else {
        console.warn("[BOOKING SYSTEM] Mail transporter not configured (no SMTP/RESEND_API_KEY). Simulation mode.");
        emailSent = false;
        emailError = "SMTP/Resend parameters not configured. Email logged to server console successfully.";
      }
    } catch (mailErr: any) {
      console.error("[BOOKING SYSTEM] Email sending failed:", mailErr.message);
      emailError = mailErr.message;
    }

    res.json({
      success: true,
      bookingId,
      emailSent,
      emailError: emailError || null
    });
  } catch (err: any) {
    console.error("Booking creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});
