// 1. Import the sqlite3 tool. 
// The '.verbose()' part is a developer trick that gives us highly detailed error messages if our SQL fails.
const sqlite3 = require('sqlite3').verbose();

// 2. Connect to the Database
// We are telling SQLite to create a file named 'inventory.sqlite' in the main folder.
// If the file already exists, it will just open it.
const db = new sqlite3.Database('./inventory.sqlite', (err) => {
    if (err) {
        // If it fails (e.g., hard drive is full, permission denied), print the error
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');

        // 3. Create the Tables
        // db.serialize() tells Node.js: "Run these SQL queries one after the other, in exact order."
        // We don't want it trying to create Sales before Products exists!
        db.serialize(() => {

            // Table 1: The Main Products List
            // We use 'IF NOT EXISTS' so it doesn't crash if we restart the server tomorrow
            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    item_code TEXT PRIMARY KEY,       -- e.g., 'AB-001'. This must be unique!
                    item_name TEXT NOT NULL,          -- e.g., 'ANGLE BAR 1/4 X 1'
                    cost_price REAL NOT NULL,         -- REAL handles the decimals (237.00)
                    srp REAL NOT NULL,                -- Suggested Retail Price
                    current_stock INTEGER DEFAULT 0   -- Starts at 0 if we don't provide a number
                )
            `);

            // Table 2: Sales History (To replace the Excel 'Sales' column formula)
            db.run(`
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_code TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_code) REFERENCES products(item_code)
                )
            `);

            // Table 3: Purchase History (To replace the Excel 'Total Purch' column formula)
            db.run(`
                CREATE TABLE IF NOT EXISTS purchases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_code TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_code) REFERENCES products(item_code)
                )
            `);

            console.log('✅ All database tables are ready.');
        });
    }
});

// 4. Export the Database Connection
// This line is crucial. It packages up this 'db' connection so that our Model files 
// can import it and use it to actually insert or read data later.
module.exports = db;