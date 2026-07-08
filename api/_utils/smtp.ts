import nodemailer from "nodemailer";
import { stripQuotes } from "./env.js";

interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export function getMailTransporter() {
  try {
    const apiKey = stripQuotes(process.env.RESEND_API_KEY || "");

    // 1. If RESEND_API_KEY is configured, prioritize Resend API
    if (apiKey) {
      console.log("[getMailTransporter] Utilizing Resend API for email dispatch.");
      return {
        sendMail: async (mailOptions: MailOptions) => {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: mailOptions.from,
              to: mailOptions.to,
              subject: mailOptions.subject,
              text: mailOptions.text,
              html: mailOptions.html
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Resend API error (${response.status}): ${errText}`);
          }

          return response.json();
        }
      };
    }

    // 2. If SMTP variables are configured, use Nodemailer SMTP
    const rawHost = stripQuotes(process.env.VITE_SMTP_HOST || process.env.SMTP_HOST || "");
    const rawUser = stripQuotes(process.env.VITE_SMTP_USER || process.env.SMTP_USER || "");
    const rawPass = stripQuotes(process.env.VITE_SMTP_PASS || process.env.SMTP_PASS || "");
    const rawPortStr = stripQuotes(process.env.VITE_SMTP_PORT || process.env.SMTP_PORT || "");
    const rawSecureStr = stripQuotes(process.env.VITE_SMTP_SECURE || process.env.SMTP_SECURE || "");

    if (rawHost && rawUser && rawPass) {
      console.log("[getMailTransporter] Utilizing standard SMTP (Nodemailer) for email dispatch.");
      const portVal = parseInt(rawPortStr || "587", 10);
      const secureVal = rawSecureStr === "true" || portVal === 465;

      const smtpOptions = {
        host: rawHost,
        port: portVal,
        secure: secureVal,
        auth: {
          user: rawUser,
          pass: rawPass
        }
      };

      let createTransportFn: any = null;
      if (nodemailer && typeof (nodemailer as any).createTransport === "function") {
        createTransportFn = (nodemailer as any).createTransport;
      } else if (nodemailer && (nodemailer as any).default && typeof (nodemailer as any).default.createTransport === "function") {
        createTransportFn = (nodemailer as any).default.createTransport;
      }

      if (createTransportFn) {
        return {
          sendMail: async (mailOptions: MailOptions) => {
            const transporterInstance = createTransportFn(smtpOptions);
            return transporterInstance.sendMail(mailOptions);
          }
        };
      } else {
        console.warn("[getMailTransporter] Nodemailer createTransport function could not be resolved.");
      }
    }

    console.warn("[getMailTransporter] Neither RESEND_API_KEY nor SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS) are configured.");
  } catch (err: any) {
    console.error("[getMailTransporter Exception] Could not construct mail transporter:", err);
  }
  return null;
}

export function getFromEmailAddress(): string {
  let rawFrom = stripQuotes(process.env.VITE_SMTP_FROM || process.env.SMTP_FROM || "");
  let rawUser = stripQuotes(process.env.VITE_SMTP_USER || process.env.SMTP_USER || "");

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  if (rawFrom && emailRegex.test(rawFrom)) {
    if (!rawFrom.includes("<") && !rawFrom.includes(">")) {
      return `"Upside Fine Dining" <${rawFrom}>`;
    }
    return rawFrom;
  }

  if (rawFrom && !emailRegex.test(rawFrom)) {
    return `"${rawFrom}" <noreply@upside-restaurant-cafe.com>`;
  }

  if (rawUser && emailRegex.test(rawUser)) {
    return `"Upside Fine Dining" <${rawUser}>`;
  }

  return `"Upside Fine Dining" <noreply@upside-restaurant-cafe.com>`;
}
