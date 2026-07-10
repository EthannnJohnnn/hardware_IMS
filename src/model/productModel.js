const db = require('../config/database');

const ProductModel = {
    getAllProducts: (callback) => {
        // ✨ NEW: Tell the database to ignore the phantom EXCHANGE product!
        // Ignore BOTH phantom products so they don't clutter the inventory
        const sql = `SELECT * FROM products WHERE item_code NOT IN ('EXCHANGE', 'PENALTY')`;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            return callback(null, rows);
        });
    },

    createProduct: (productData, callback) => {
        const sql = `INSERT INTO products (item_code, item_name, cost_price, srp, current_stock) VALUES (?, ?, ?, ?, ?)`;
        const values = [productData.item_code, productData.item_name, productData.cost_price, productData.srp, productData.current_stock];
        db.run(sql, values, function(err) {
            if (err) return callback(err, null);
            return callback(null, { message: "Product added successfully!" });
        });
    },

    // ✨ THE NEW TRANSFER LOGIC IS HERE ✨
    adjustStock: (item_code, action, qty, callback) => {
        if (action === 'transfer_out') {
            db.run(`UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`, [qty, item_code], function(err) {
                if (err) return callback(err, null);
                callback(null, { message: "Stock transferred out." });
            });
        } else if (action === 'transfer_in') {
            db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [qty, item_code], function(err) {
                if (err) return callback(err, null);
                callback(null, { message: "Stock transferred in." });
            });
        }
    },

    // ✨ PHASE 21: UPDATE PRODUCT MODEL ✨
    // ✨ PHASE 21: UPDATE PRODUCT MODEL (FIXED FOR ITEM_CODE) ✨
    updateProduct: (original_item_code, item_code, item_name, cost_price, srp, callback) => {
        const sql = `
            UPDATE products 
            SET item_code = ?, 
                item_name = ?, 
                cost_price = ?, 
                srp = ?
            WHERE item_code = ?
        `;
        
        // Use the original_item_code to find it, then overwrite it!
        db.run(sql, [item_code, item_name, cost_price, srp, original_item_code], function(err) {
            if (err) return callback(err, null);
            callback(null, { updatedRows: this.changes });
        });
    }
};

module.exports = ProductModel;