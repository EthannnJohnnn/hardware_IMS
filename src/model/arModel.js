const db = require('../config/database');

const ARModel = {
    // Join with products table so the frontend can display the actual item name!
    getAllAR: (callback) => {
        const sql = `
            SELECT ar.*, p.item_name 
            FROM ar 
            LEFT JOIN products p ON ar.item_code = p.item_code
            ORDER BY ar.id DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            return callback(null, rows);
        });
    },

    addDebt: (debtData, callback) => {
        // 1. Fetch the product to ensure we have enough stock, and grab its SRP
        db.get(`SELECT current_stock, srp FROM products WHERE item_code = ?`, [debtData.item_code], (err, product) => {
            if (err) return callback(err, null);
            if (!product) return callback(new Error("Product not found"), null);
            if (product.current_stock < debtData.qty) return callback(new Error("Insufficient stock to issue debt."), null);

            // 2. Automatically calculate how much the customer owes based on the current SRP
            const total_amount = product.srp * debtData.qty;

            // 3. Save the debt to the AR table
            const insertArSql = `INSERT INTO ar (customer_name, item_code, qty, total_amount) VALUES (?, ?, ?, ?)`;
            db.run(insertArSql, [debtData.customer_name, debtData.item_code, debtData.qty, total_amount], function(err) {
                if (err) return callback(err, null);

                // 4. Instantly deduct the item from the physical inventory
                const updateStockSql = `UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`;
                db.run(updateStockSql, [debtData.qty, debtData.item_code], function(err) {
                    if (err) return callback(err, null);
                    return callback(null, { message: "Debt recorded and stock deducted!" });
                });
            });
        });
    },

    markAsPaid: (id, callback) => {
        // 1. Mark the debt as Paid
        db.run(`UPDATE ar SET status = 'Paid' WHERE id = ?`, [id], function(err) {
            if (err) return callback(err, null);

            // 2. Grab the exact item and quantity from the paid debt
            db.get(`SELECT item_code, qty FROM ar WHERE id = ?`, [id], (err, debt) => {
                if (err) return callback(err, null);
                if (!debt) return callback(new Error("Debt not found"), null);

                // 3. Inject it directly into the Sales Ledger!
                // (Notice we do NOT deduct stock here, because it was already deducted when they took the item)
                const insertSaleSql = `INSERT INTO sales (item_code, quantity) VALUES (?, ?)`;
                db.run(insertSaleSql, [debt.item_code, debt.qty], function(err) {
                    if (err) return callback(err, null);
                    return callback(null, { message: "Debt paid and converted to Sale!" });
                });
            });
        });
    }
};

module.exports = ARModel;