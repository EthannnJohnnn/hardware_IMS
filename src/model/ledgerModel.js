const db = require('../config/database');

const LedgerModel = {
    // ==========================================
    // 1. EXISTING READ FUNCTIONS (With 'id' added)
    // ==========================================
    getSalesLedger: (callback) => {
        const sql = `
            SELECT s.id, s.sale_date AS date, s.item_code, p.item_name, p.srp AS unit_price, 
                   s.quantity AS qty_sold, COALESCE(s.discount, 0) AS discount, 
                   ((p.srp * s.quantity) - COALESCE(s.discount, 0)) AS total_sales
            FROM sales s
            JOIN products p ON s.item_code = p.item_code
            ORDER BY s.sale_date DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            callback(null, rows);
        });
    },
    
    getPurchaseLedger: (callback) => {
        const sql = `
            SELECT pu.id, pu.purchase_date AS date, pu.item_code, p.item_name, pu.cost_price, pu.quantity AS qty_purchased, (pu.cost_price * pu.quantity) AS total_cost, pu.supplier
            FROM purchases pu
            JOIN products p ON pu.item_code = p.item_code
            ORDER BY pu.purchase_date DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            callback(null, rows);
        });
    },

    // ==========================================
    // 2. NEW PHASE 14 ADMIN EDIT FUNCTIONS
    // ==========================================
    editSale: (id, newQty, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // 1. Fetch the original mistake
            db.get(`SELECT item_code, quantity FROM sales WHERE id = ?`, [id], (err, oldSale) => {
                if (err || !oldSale) { db.run("ROLLBACK"); return callback(new Error("Sale not found"), null); }

                // 2. Calculate the difference (If old was 5, new is 2, diff is +3 items back to stock)
                const stockDiff = oldSale.quantity - newQty;

                // 3. Safely update the physical inventory
                db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [stockDiff, oldSale.item_code], function(err) {
                    if (err) { db.run("ROLLBACK"); return callback(err, null); }

                    // 4. Overwrite the ledger with the new correct quantity
                    db.run(`UPDATE sales SET quantity = ? WHERE id = ?`, [newQty, id], function(err) {
                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                        
                        db.run("COMMIT"); // Lock it in!
                        callback(null, { message: "Sale updated and inventory automatically recalculated." });
                    });
                });
            });
        });
    },

    editPurchase: (id, data, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // 1. Fetch the original mistake
            db.get(`SELECT item_code, quantity FROM purchases WHERE id = ?`, [id], (err, oldPurch) => {
                if (err || !oldPurch) { db.run("ROLLBACK"); return callback(new Error("Purchase not found"), null); }

                // 2. For purchases, if old was 5, new is 10, difference is +5 to add to stock
                const stockDiff = data.newQty - oldPurch.quantity; 

                // 3. Safely update the physical inventory
                db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [stockDiff, oldPurch.item_code], function(err) {
                    if (err) { db.run("ROLLBACK"); return callback(err, null); }

                    // 4. Overwrite the ledger with the new correct data
                    const sql = `UPDATE purchases SET quantity = ?, cost_price = ?, supplier = ? WHERE id = ?`;
                    db.run(sql, [data.newQty, data.newCost, data.newSupplier, id], function(err) {
                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                        
                        db.run("COMMIT");
                        callback(null, { message: "Purchase updated and inventory automatically recalculated." });
                    });
                });
            });
        });
    }
};

module.exports = LedgerModel;