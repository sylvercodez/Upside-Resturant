// Mock of firebase/app targeting local MySQL REST endpoints
export function initializeApp(config: any = {}) {
  console.log("[MySQL Client App] Initialized custom app client.");
  return {
    name: "mysql-app",
    options: config,
    automaticDataCollectionEnabled: false
  };
}
