import crypto from "crypto";

/**
 * Safely formats the secret key into the proper byte buffer depending on cipher block requirements.
 */
function getCipherKey(secretKey: string, algorithm: string): Buffer {
  // Use SHA-256 to ensure standard fixed key sizes
  const hash = crypto.createHash("sha256").update(secretKey).digest();
  if (algorithm.includes("128")) {
    return hash.subarray(0, 16);
  } else if (algorithm.includes("192")) {
    return hash.subarray(0, 24);
  }
  return hash; // 32 bytes for AES-256
}

/**
 * Encrypts a JSON payload or string data using AES algorithm.
 */
export function encryptPayload(data: any, secretKey: string, algorithm = "aes-256-ecb"): string {
  try {
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
    const key = getCipherKey(secretKey, algorithm);
    const cipher = crypto.createCipheriv(algorithm, key, null);
    let encrypted = cipher.update(jsonStr, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (err: any) {
    console.error("[OPay Helper] Encryption failure:", err);
    throw new Error(`OPay Encryption failed: ${err.message}`);
  }
}

/**
 * Decrypts an encrypted hex string back into its original JSON content.
 */
export function decryptPayload(encryptedHex: string, secretKey: string, algorithm = "aes-256-ecb"): any {
  try {
    const key = getCipherKey(secretKey, algorithm);
    const decipher = crypto.createDecipheriv(algorithm, key, null);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (err: any) {
    console.error("[OPay Helper] Decryption failure:", err);
    throw new Error(`OPay Decryption failed: ${err.message}`);
  }
}

/**
 * Generates an HMAC-SHA512 or HMAC-SHA256 signature for the parameters.
 */
export function generateSignature(paramContent: string, timestamp: string, secretKey: string): string {
  try {
    const payload = paramContent + timestamp;
    return crypto.createHmac("sha512", secretKey).update(payload).digest("hex");
  } catch (err: any) {
    console.error("[OPay Helper] Signature generation failure:", err);
    throw new Error(`OPay Signature generation failed: ${err.message}`);
  }
}

/**
 * Recursively keys-sorted object for OPay API signature calculation.
 */
export function sortOpayObject(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortOpayObject);
  } else if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((obj: any, key: string) => {
        obj[key] = sortOpayObject(value[key]);
        return obj;
      }, {});
  }
  return value;
}

/**
 * Generates standard recursive-sorted JSON payload HMAC-SHA512 signature for OPay API status calls.
 */
export function generateOpayApiSignature(payload: any, secretKey: string): string {
  const sorted = sortOpayObject(payload);
  const serialized = JSON.stringify(sorted);
  return crypto.createHmac("sha512", secretKey).update(serialized).digest("hex");
}

/**
 * Verifies if a callback or webhook payload signature is authentic. Supports both 3-argument and 4-argument overloads.
 */
export function verifyWebhookSignature(
  paramContent: any,
  timestampOrSignature: string,
  clientAuthKeyOrSecretKey: string,
  maybeSecretKey?: string
): boolean {
  try {
    let expected = "";
    let actual = "";

    if (maybeSecretKey === undefined) {
      // 3-argument overload: verifyWebhookSignature(payloadObj, signature, secretKey)
      const payloadObj = typeof paramContent === "string" ? JSON.parse(paramContent) : paramContent;
      expected = generateOpayApiSignature(payloadObj, clientAuthKeyOrSecretKey);
      actual = timestampOrSignature;
    } else {
      // 4-argument overload: verifyWebhookSignature(paramContentString, timestamp, clientAuthKey, secretKey)
      expected = generateSignature(paramContent, timestampOrSignature, maybeSecretKey);
      actual = clientAuthKeyOrSecretKey;
    }

    const bufferExpected = Buffer.from(expected, "hex");
    const bufferActual = Buffer.from(actual, "hex");
    
    if (bufferExpected.length !== bufferActual.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufferExpected, bufferActual);
  } catch (err) {
    console.error("[OPay Helper] Webhook verification failure:", err);
    return false;
  }
}
