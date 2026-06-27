// 1. Import our database connection
const db = require('../config/database');

// 2. Create the TransactionModel object
const TransactionModel = {

    // --- FUNCTION 1: Record a Sale (Subtracts from stock) ---
    // 'saleData' will contain { item_code: "AB-001", quantity: 2 }
    recordSale: (saleData, callback) => {
        
        // Step A: Save the record into the 'sales' history table
        const insertSaleQuery = `INSERT INTO sales (item_code, quantity) VALUES (?, ?)`;

        // We run the first query...
        db.run(insertSaleQuery, [saleData.item_code, saleData.quantity], function(err) {
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
                return callback(null, { message: "Sale recorded and stock updated successfully!" });
            });
        });
    },

    // --- FUNCTION 2: Record a Purchase/Restock (Adds to stock) ---
    // 'purchaseData' will contain { item_code: "AB-001", quantity: 50 }
    // --- FUNCTION 2: Record a Purchase/Restock (Adds to stock) ---
    recordPurchase: (purchaseData, callback) => {
        
        // PHASE 4 UPDATE: Added cost_price and supplier to the INSERT statement
        const insertPurchaseQuery = `
            INSERT INTO purchases (item_code, quantity, cost_price, supplier) 
            VALUES (?, ?, ?, ?)
        `;

        const values = [
            purchaseData.item_code, 
            purchaseData.quantity, 
            purchaseData.cost_price, 
            purchaseData.supplier
        ];

        db.run(insertPurchaseQuery, values, function(err) {
            if (err) {
                console.error("Error recording purchase:", err);
                return callback(err, null);
            }

            // Step B: Update the product's stock (Same as before)
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