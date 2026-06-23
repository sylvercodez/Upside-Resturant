import admin from "firebase-admin";

export async function appCheckVerification(req: any, res: any, next: any) {
  try {
    const path = req.path;

    // Exempt external callbacks, webhooks or redirects
    const isExempt = 
      path === "/opay/webhook" ||
      path === "/opay/callback" ||
      path === "/instagram/callback" ||
      path === "/api/opay/webhook" ||
      path === "/api/opay/callback" ||
      path === "/api/instagram/callback";

    if (isExempt) {
      return next();
    }

    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
      console.warn(`[App Check Warning] Missing App Check token from IP ${req.ip} for URI ${req.originalUrl} (Gracefully allowed)`);
      return next();
    }

    if (!admin || typeof admin.appCheck !== "function") {
      console.warn(`[App Check Warning] Firebase Admin App Check is not initialized or not supported. Gracefully allowing.`);
      return next();
    }

    const decodedToken = await admin.appCheck().verifyToken(appCheckToken);
    req.appCheckToken = decodedToken;
    next();
  } catch (err: any) {
    console.warn(`[App Check Warning] Token verification failed from IP ${req.ip} for URI ${req.originalUrl} (Gracefully allowed):`, err.message || err);
    return next();
  }
}
