const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./inventory.sqlite');

db.serialize(() => {
    console.log("🚀 Starting Phase 36 Database Migration...");

    // 1. Add the new snapshot columns
    // We ignore "duplicate column" errors in case you run this script twice
    const queries = [
        "ALTER TABLE sales ADD COLUMN item_name TEXT",
        "ALTER TABLE sales ADD COLUMN cost_price REAL",
        "ALTER TABLE sales ADD COLUMN srp REAL",
        "ALTER TABLE purchases ADD COLUMN item_name TEXT",
        "ALTER TABLE purchases ADD COLUMN cost_price REAL",
        "ALTER TABLE purchases ADD COLUMN srp REAL"
    ];

    queries.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error("Error adding column:", err.message);
            }
        });
    });

    console.log("✅ Columns added. Starting historical data backfill...");

    // 2. Backfill existing Sales
    const backfillSales = `
        UPDATE sales
        SET
            item_name = (SELECT item_name FROM products WHERE products.item_code = sales.item_code),
            cost_price = (SELECT cost_price FROM products WHERE products.item_code = sales.item_code),
            srp = (SELECT srp FROM products WHERE products.item_code = sales.item_code)
        WHERE item_name IS NULL
    `;

    db.run(backfillSales, (err) => {
        if(err) console.error("🛑 Sales backfill error:", err.message);
        else console.log("✅ Sales history successfully snapshotted!");
    });

    // 3. Backfill existing Purchases
    const backfillPurchases = `
        UPDATE purchases
        SET
            item_name = (SELECT item_name FROM products WHERE products.item_code = purchases.item_code),
            cost_price = (SELECT cost_price FROM products WHERE products.item_code = purchases.item_code),
            srp = (SELECT srp FROM products WHERE products.item_code = purchases.item_code)
        WHERE item_name IS NULL
    `;

    db.run(backfillPurchases, (err) => {
        if(err) console.error("🛑 Purchases backfill error:", err.message);
        else console.log("✅ Purchase history successfully snapshotted!");
        
        console.log("🎉 Phase 36 Migration Complete! You can close this script.");
    });
});