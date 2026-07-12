const db = require('../config/database');

const ProductModel = {
    getAllProducts: (callback) => {
        // ✨ PHASE 24: Added ORDER BY item_name ASC for alphabetical sorting
        const sql = `SELECT * FROM products WHERE item_code NOT IN ('EXCHANGE', 'PENALTY') ORDER BY item_name ASC`;
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

    // ✨ THE NEW TRANSFER & INVENTORY LOGIC ✨
    adjustStock: (item_code, action, qty, callback) => {
        if (action === 'transfer_out') {
            db.run(`UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`, [qty, item_code], function(err) {
                if (err) return callback(err, null);
                callback(null, { message: "Stock transferred out." });
            });
        } else if (action === 'transfer_in' || action === 'beginning_inventory') {
            // ✨ Treat Beginning Inventory exactly like Transfer In (adds stock, costs nothing!)
            db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, [qty, item_code], function(err) {
                if (err) return callback(err, null);
                callback(null, { message: "Stock increased successfully." });
            });
        }
    },


    // PHASE 21: UPDATE PRODUCT MODEL (FIXED FOR ITEM_CODE) 
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