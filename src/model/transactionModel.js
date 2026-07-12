// 1. Import our database connection
const db = require('../config/database');

// 2. Create the TransactionModel object
const TransactionModel = {

    // --- FUNCTION 1: Record a Sale (Subtracts from stock) ---
    // 'saleData' will contain { item_code: "AB-001", quantity: 2, discount: 50 }
    recordSale: (saleData, callback) => {
        
        // PHASE 15 UPDATE: Ensure discount is at least 0 if left blank by the cashier
        const discountAmount = saleData.discount || 0; 

        // Step A: Save the record into the 'sales' history table (Now includes discount!)
        const insertSaleQuery = `INSERT INTO sales (item_code, quantity, discount) VALUES (?, ?, ?)`;

        // We run the first query...
        db.run(insertSaleQuery, [saleData.item_code, saleData.quantity, discountAmount], function(err) {
            if (err) {
                console.error("Error recording sale:", err);
                return callback(err, null);
            }

            // Step B: If the sale is saved successfully, we update the product's stock.
            // Notice the math here: "current_stock = current_stock - ?" 
            // This exactly mimics the Excel subtraction formula!
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
    // 'purchaseData' will contain { item_code: "AB-001", quantity: 50, cost_price: 100, supplier: "Hardware Inc" }
    // --- FUNCTION 2: Record a Purchase/Restock (Adds to stock) ---
    recordPurchase: (purchaseData, callback) => {
        
        // We leave the column name as cost_price so we don't break your database table,
        // but we will inject the calculated TOTAL cost into it!
        const insertPurchaseQuery = `
            INSERT INTO purchases (item_code, quantity, cost_price, supplier) 
            VALUES (?, ?, ?, ?)
        `;

        // ✨ PHASE 25 UPDATE: Catch the total_price from the frontend!
        const values = [
            purchaseData.item_code, 
            purchaseData.quantity, 
            purchaseData.total_price, // 👈 THE MAGIC FIX IS HERE (₱1,500)
            purchaseData.supplier
        ];

        db.run(insertPurchaseQuery, values, function(err) {
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
    }
};

// 3. Export the object
module.exports = TransactionModel;