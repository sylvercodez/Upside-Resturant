async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/debug-sync");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log("=== FIRESTORE DATA ===");
    console.log("Users:", data.firestore.usersCount, data.firestore.users);
    console.log("Orders:", data.firestore.ordersCount, data.firestore.orders);
    console.log("Riders:", data.firestore.ridersCount, data.firestore.riders);

    console.log("\n=== MYSQL DATA ===");
    console.log("Users:", data.mysql.usersCount, data.mysql.users);
    console.log("Orders:", data.mysql.ordersCount, data.mysql.orders);
    console.log("Riders:", data.mysql.ridersCount, data.mysql.riders);
    
    process.exit(0);
  } catch (err: any) {
    console.error("Error calling debug-sync API:", err);
    process.exit(1);
  }
}

main();
