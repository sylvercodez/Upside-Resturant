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

  // Ensure MySQL variables are correctly parsed, stripped of quotes, and sanitized
  const mysqlKeys = ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"];
  for (const key of mysqlKeys) {
    const rawVal = process.env[key];
    if (rawVal !== undefined) {
      let cleanVal = stripQuotes(rawVal);
      if (key === "MYSQL_HOST") {
        // Strip protocol prefix if present
        if (cleanVal.toLowerCase().startsWith("http://")) {
          cleanVal = cleanVal.substring(7);
        } else if (cleanVal.toLowerCase().startsWith("https://")) {
          cleanVal = cleanVal.substring(8);
        }
        // Strip any trailing path components
        const slashIdx = cleanVal.indexOf("/");
        if (slashIdx !== -1) {
          cleanVal = cleanVal.substring(0, slashIdx);
        }
        // Strip trailing port
        const colonIdx = cleanVal.indexOf(":");
        if (colonIdx !== -1) {
          cleanVal = cleanVal.substring(0, colonIdx);
        }
        cleanVal = cleanVal.trim();
      }
      process.env[key] = cleanVal;
    }
  }
}
