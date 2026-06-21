import dotenv from "dotenv";

dotenv.config();

export const stripQuotes = (str: string): string => {
  if (!str) return "";
  let s = str.trim();
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1).trim();
  }
  return s;
};

const envKeysToMap = [
  "OPAY_MERCHANT_ID",
  "OPAY_PUBLIC_KEY",
  "OPAY_SECRET_KEY",
  "OPAY_ENVIRONMENT",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM"
];

export function mapEnvVariables() {
  for (const key of envKeysToMap) {
    const viteKey = `VITE_${key}`;
    const rawVal = process.env[key] || process.env[viteKey];
    if (rawVal !== undefined) {
      const cleanVal = stripQuotes(rawVal);
      process.env[key] = cleanVal;
      process.env[viteKey] = cleanVal;
    }
  }
}
