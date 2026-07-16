const db = require('../config/database');

const LedgerModel = {
    getSalesLedger: (filter, callback) => {
        let timeCondition = "";
        
        if (filter === 'daily') timeCondition = "WHERE DATE(s.sale_date) = DATE('now', 'localtime')";
        else if (filter === 'weekly') timeCondition = "WHERE DATE(s.sale_date) >= DATE('now', '-7 days', 'localtime')";
        else if (filter === 'monthly') timeCondition = "WHERE DATE(s.sale_date) >= DATE('now', '-1 months', 'localtime')";

        const sql = `
            SELECT 
                s.id, 
                s.sale_date AS date, 
                s.item_code, 
                s.item_name, 
                s.srp AS unit_price, 
                s.quantity AS qty_sold, 
                s.discount, 
                ((s.srp * s.quantity) - s.discount) AS total_sales
            FROM sales s
            ${timeCondition}
            ORDER BY s.id DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("🛑 DB Error (Sales Ledger):", err.message);
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    getPurchasesLedger: (filter, callback) => {
        let timeCondition = "";
        
        if (filter === 'daily') timeCondition = "WHERE DATE(pur.purchase_date) = DATE('now', 'localtime')";
        else if (filter === 'weekly') timeCondition = "WHERE DATE(pur.purchase_date) >= DATE('now', '-7 days', 'localtime')";
        else if (filter === 'monthly') timeCondition = "WHERE DATE(pur.purchase_date) >= DATE('now', '-1 months', 'localtime')";

        const sql = `
            SELECT 
                pur.id, 
                pur.purchase_date AS date, 
                pur.item_code, 
                pur.item_name, 
                (pur.cost_price / pur.quantity) AS cost_price, 
                pur.quantity AS qty_purchased, 
                pur.cost_price AS total_cost, 
                pur.supplier 
            FROM purchases pur
            ${timeCondition}
            ORDER BY pur.id DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("🛑 DB Error (Purchase Ledger):", err.message);
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    editSale: (id, data, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            // 1. Fetch the original mistake
            db.get(`SELECT item_code, quantity FROM sales WHERE id = ?`, [id], (err, oldSale) => {
                if (err || !oldSale) { db.run("ROLLBACK"); return callback(new Error("Sale not found"), null); }

                // 2. Calculate the difference for inventory
                const stockDiff = oldSale.quantity - data.newQty;

                // 3. Update physical inventory
                db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [stockDiff, oldSale.item_code], function(err) {
                    if (err) { db.run("ROLLBACK"); return callback(err, null); }

                    // 4. ✨ Overwrite ledger with new Qty, Price (srp), and Discount
                    const updateSaleSql = `UPDATE sales SET quantity = ?, srp = ?, discount = ? WHERE id = ?`;
                    db.run(updateSaleSql, [data.newQty, data.newPrice, data.newDiscount, id], function(err) {
                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                        
                        db.run("COMMIT"); 
                        callback(null, { message: "Sale updated and inventory automatically recalculated." });
                    });
                });
            });
        });
    },

    editPurchase: (id, data, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            db.get(`SELECT item_code, quantity FROM purchases WHERE id = ?`, [id], (err, oldPurch) => {
                if (err || !oldPurch) { db.run("ROLLBACK"); return callback(new Error("Purchase not found"), null); }

                const stockDiff = data.newQty - oldPurch.quantity; 

                db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [stockDiff, oldPurch.item_code], function(err) {
                    if (err) { db.run("ROLLBACK"); return callback(err, null); }

                    const sql = `UPDATE purchases SET quantity = ?, cost_price = ?, supplier = ? WHERE id = ?`;
                    db.run(sql, [data.newQty, data.newCost, data.newSupplier, id], function(err) {
                        if (err) { db.run("ROLLBACK"); return callback(err, null); }
                        
                        db.run("COMMIT");
                        callback(null, { message: "Purchase updated and inventory automatically recalculated." });
                    });
                });
            });
        });
    },
};

module.exports = LedgerModel;