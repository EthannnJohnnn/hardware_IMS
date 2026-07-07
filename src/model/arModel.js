const db = require('../config/database');

const ARModel = {
    // --- 1. FETCH AR & CALCULATE PENALTIES ON THE FLY ---
    getAllAR: (callback) => {
        // We select qty AS quantity so it perfectly matches the frontend JavaScript
        const sql = `
            SELECT ar.*, ar.qty AS quantity, p.item_name 
            FROM ar 
            LEFT JOIN products p ON ar.item_code = p.item_code
            ORDER BY ar.status DESC, ar.id DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            
            const currentDate = new Date();
            
            // THE MATH ENGINE: Calculate days overdue and 2% penalty
            rows.forEach(row => {
                const txDate = new Date(row.date);
                const diffTime = Math.abs(currentDate - txDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                row.days_overdue = diffDays;
                row.penalty = 0;
                row.base_debt = row.total_amount; // Using your existing total_amount column

                // Apply 2% Monthly penalty ONLY if Unpaid and past 7 days
                if (row.status === 'Unpaid' && diffDays > 7) {
                    // Math.ceil ensures day 8 is 1 month late, day 38 is 2 months late, etc.
                    const monthsLate = Math.ceil((diffDays - 7) / 30);
                    row.penalty = (row.base_debt * 0.02) * monthsLate;
                }
                
                row.total_due = row.base_debt + row.penalty;
            });
            
            return callback(null, rows);
        });
    },

    // --- 2. LOG NEW DEBT (Kept exactly as you wrote it!) ---
    addDebt: (debtData, callback) => {
        db.get(`SELECT current_stock, srp FROM products WHERE item_code = ?`, [debtData.item_code], (err, product) => {
            if (err) return callback(err, null);
            if (!product) return callback(new Error("Product not found"), null);
            if (product.current_stock < debtData.qty) return callback(new Error("Insufficient stock to issue debt."), null);

            const total_amount = product.srp * debtData.qty;

            const insertArSql = `INSERT INTO ar (customer_name, item_code, qty, total_amount) VALUES (?, ?, ?, ?)`;
            db.run(insertArSql, [debtData.customer_name, debtData.item_code, debtData.qty, total_amount], function(err) {
                if (err) return callback(err, null);

                const updateStockSql = `UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`;
                db.run(updateStockSql, [debtData.qty, debtData.item_code], function(err) {
                    if (err) return callback(err, null);
                    return callback(null, { message: "Debt recorded and stock deducted!" });
                });
            });
        });
    },

    // --- 3. SETTLE DEBT & INJECT PENALTY INTO SALES ---
    markAsPaid: (id, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // Step A: Fetch the exact record so we can calculate the final penalty safely on the backend
            db.get(`SELECT * FROM ar WHERE id = ? AND status = 'Unpaid'`, [id], (err, debt) => {
                if (err || !debt) { db.run("ROLLBACK"); return callback(new Error("Debt not found or already paid"), null); }

                // Calculate the final penalty
                const txDate = new Date(debt.date);
                const diffDays = Math.floor(Math.abs(new Date() - txDate) / (1000 * 60 * 60 * 24));
                
                let penalty = 0;
                if (diffDays > 7) {
                    const monthsLate = Math.ceil((diffDays - 7) / 30);
                    penalty = (debt.total_amount * 0.02) * monthsLate;
                }

                // Step B: Mark the debt as Paid in the AR table
                db.run(`UPDATE ar SET status = 'Paid' WHERE id = ?`, [id], function(err) {
                    if (err) { db.run("ROLLBACK"); return callback(err, null); }

                    // Step C: Inject Base Debt into Sales (Using the discount column we added in Phase 15)
                    db.run(`INSERT INTO sales (item_code, quantity, discount) VALUES (?, ?, 0)`, [debt.item_code, debt.qty], function(err) {
                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                        
                        // Step D: If there is a penalty, inject it using the Phantom Product!
                        if (penalty > 0) {
                            db.get(`SELECT item_code FROM products WHERE item_code = 'PENALTY'`, (err, prod) => {
                                if (!prod) {
                                    // Create the Phantom Penalty item if it doesn't exist
                                    db.run(`INSERT INTO products (item_code, item_name, cost_price, srp, current_stock) VALUES ('PENALTY', 'AR Late Fee Penalty', 0, 1, 0)`, finishPenalty);
                                } else {
                                    finishPenalty();
                                }

                                function finishPenalty() {
                                    db.run(`INSERT INTO sales (item_code, quantity, discount) VALUES ('PENALTY', ?, 0)`, [penalty], (err) => {
                                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                                        db.run("COMMIT");
                                        return callback(null, { message: "Debt paid with penalty and converted to Sale!" });
                                    });
                                }
                            });
                        } else {
                            // No penalty, just commit the base debt sale
                            db.run("COMMIT");
                            return callback(null, { message: "Debt paid on time and converted to Sale!" });
                        }
                    });
                });
            });
        });
    }
};

module.exports = ARModel;