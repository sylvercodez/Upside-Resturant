// Mock of firebase/app-check targeting local MySQL architecture
export class ReCaptchaV3Provider {
  constructor(public siteKey: string) {
    console.log("[MySQL Mock AppCheck] Instantiated ReCaptchaV3Provider with siteKey:", siteKey);
  }
}

export function initializeAppCheck(app: any, options: any) {
  console.log("[MySQL Mock AppCheck] Initialized Mock App Check.");
  return {
    app,
    options
  };
}

export async function getToken(appCheckInstance: any, forceRefresh?: boolean) {
  return {
    token: "mysql-mock-appcheck-token"
  };
}
