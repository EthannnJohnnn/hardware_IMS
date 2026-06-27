// src/config/database.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./inventory.sqlite', (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');

        db.serialize(() => {

            // 1. Core Products Table (Unchanged)
            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    item_code TEXT PRIMARY KEY,
                    item_name TEXT NOT NULL,
                    cost_price REAL NOT NULL,
                    srp REAL NOT NULL,
                    current_stock INTEGER DEFAULT 0
                )
            `);

            // 2. Sales History (Unchanged)
            db.run(`
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_code TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_code) REFERENCES products(item_code)
                )
            `);

            // ==========================================
            // PHASE 4: NEW FINANCIAL TABLES
            // ==========================================

            // 3. UPDATED Purchases Table (Now tracks Supplier and specific Cost Price)
            db.run(`
                CREATE TABLE IF NOT EXISTS purchases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_code TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    cost_price REAL NOT NULL,         -- The price paid on THIS specific day
                    supplier TEXT,                    -- Who we bought it from
                    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_code) REFERENCES products(item_code)
                )
            `);

            // 4. NEW Expenses Table (For Payroll, Utilities, SSS, etc.)
            db.run(`
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    description TEXT NOT NULL,        -- e.g., "Payroll June 1-6"
                    amount REAL NOT NULL,             -- e.g., 9000.00
                    expense_date DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 5. NEW Accounts Receivable Table (For tracking customer debt)
            db.run(`
                CREATE TABLE IF NOT EXISTS accounts_receivable (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT NOT NULL,      -- e.g., "Max C"
                    description TEXT,                 -- e.g., "Cement and Rebars"
                    amount REAL NOT NULL,             -- e.g., 3040.00
                    status TEXT DEFAULT 'Unpaid',     -- Will change to 'Paid' later
                    date_issued DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ All financial and inventory database tables are ready.');
        });
    }
});

module.exports = db;