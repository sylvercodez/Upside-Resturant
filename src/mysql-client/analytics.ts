// Mock of firebase/analytics targeting local MySQL architecture
export function getAnalytics(app?: any) {
  console.log("[MySQL Mock Analytics] Initialized Mock Analytics.");
  return { app };
}

export function logEvent(analyticsInstance: any, eventName: string, eventParams?: any) {
  console.log(`[MySQL Mock Analytics Log] Event: "${eventName}"`, eventParams || "");
}

export async function isSupported() {
  return true;
}
