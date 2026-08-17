// Mock of firebase/app targeting local MySQL REST endpoints
export function initializeApp(config: any = {}, name?: string) {
  console.log("[MySQL Client App] Initialized custom app client.", name || "default");
  return {
    name: name || "mysql-app",
    options: config,
    automaticDataCollectionEnabled: false
  };
}

export async function deleteApp(app?: any) {
  return Promise.resolve();
}
