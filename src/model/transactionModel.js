// 1. Import our database connection
const db = require('../config/database');

// 2. Create the TransactionModel object
const TransactionModel = {

    recordSale: (saleData, callback) => {
        const discountAmount = saleData.discount || 0; 

        const insertSaleQuery = `
            INSERT INTO sales (item_code, quantity, discount, item_name, cost_price, srp)
            SELECT ?, ?, ?, item_name, cost_price, srp
            FROM products
            WHERE item_code = ?
        `;

        const saleValues = [
            saleData.item_code, 
            saleData.quantity, 
            discountAmount, 
            saleData.item_code // Sent a second time to satisfy the WHERE clause lookup
        ];

        // We run the first query...
        db.run(insertSaleQuery, saleValues, function(err) {
            if (err) {
                console.error("Error recording sale:", err);
                return callback(err, null);
            }

            // Step B: If the sale is saved successfully, we update the product's stock.
            const updateStockQuery = `UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`;

            // We run the second query nested inside the first one to guarantee order
            db.run(updateStockQuery, [saleData.quantity, saleData.item_code], function(err) {
                if (err) {
                    console.error("Error updating stock after sale:", err);
                    return callback(err, null);
                }
                
                // If both steps worked, we send a success message back
                return callback(null, { message: "Sale recorded, stock updated, and discount applied successfully!" });
            });
        });
    },

    // --- FUNCTION 2: Record a Purchase/Restock (Adds to stock) ---
    // 'purchaseData' will contain { item_code: "AB-001", quantity: 50, total_price: 1500, supplier: "Hardware Inc" }
    recordPurchase: (purchaseData, callback) => {
        
        // ✨ PHASE 36 UPDATE: Save the record into the 'purchases' history table
        // This pulls the item_name and srp from the 'products' table dynamically 
        // while injecting the total cost (total_price) into the cost_price column.
        const insertPurchaseQuery = `
            INSERT INTO purchases (item_code, quantity, cost_price, supplier, item_name, srp) 
            SELECT ?, ?, ?, ?, item_name, srp
            FROM products
            WHERE item_code = ?
        `;

        // ✨ PHASE 25 UPDATE: Catch the total_price from the frontend!
        const purchaseValues = [
            purchaseData.item_code, 
            purchaseData.quantity, 
            purchaseData.total_price, // Bound to the cost_price column (Total cost of purchase)
            purchaseData.supplier,
            purchaseData.item_code     // Sent a second time to satisfy the WHERE clause lookup
        ];

        db.run(insertPurchaseQuery, purchaseValues, function(err) {
            if (err) {
                console.error("Error recording purchase:", err);
                return callback(err, null);
            }

            // Step B: Update the product's stock
            const updateStockQuery = `UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`;

            db.run(updateStockQuery, [purchaseData.quantity, purchaseData.item_code], function(err) {
                if (err) {
                    console.error("Error updating stock after purchase:", err);
                    return callback(err, null);
                }
                
                return callback(null, { message: "Purchase recorded and stock increased successfully!" });
            });
        });
    },

    // --- FUNCTION 3: Delete a Sale (Restores Stock) ---
    deleteSale: (data, callback) => {
        // Step A: Delete the record from the ledger
        db.run(`DELETE FROM sales WHERE id = ?`, [data.id], function(err) {
            if (err) return callback(err, null);

            // Step B: Put the items BACK into inventory (current_stock + qty)
            const restoreStockQuery = `UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`;
            db.run(restoreStockQuery, [data.qty, data.item_code], function(err) {
                if (err) return callback(err, null);
                return callback(null, { message: "Sale deleted and stock restored!" });
            });
        });
    },

    // --- FUNCTION 4: Delete a Purchase (Deducts Stock) ---
    deletePurchase: (data, callback) => {
        // Step A: Delete the record from the ledger
        db.run(`DELETE FROM purchases WHERE id = ?`, [data.id], function(err) {
            if (err) return callback(err, null);

            // Step B: Remove the items from inventory (current_stock - qty)
            const revertStockQuery = `UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`;
            db.run(revertStockQuery, [data.qty, data.item_code], function(err) {
                if (err) return callback(err, null);
                return callback(null, { message: "Purchase deleted and stock reverted!" });
            });
        });
    }
};

// 3. Export the object
module.exports = TransactionModel;