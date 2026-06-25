// 1. Import our database connection from the file we just made
const db = require('../config/database');

// 2. Create an object to hold all our database functions
const ProductModel = {

    // --- FUNCTION 1: Get all products to display on the table ---
    getAllProducts: (callback) => {
        // The raw SQL query
        const sql = `SELECT * FROM products`;

        // db.all asks SQLite to get all rows that match the query
        db.all(sql, [], (err, rows) => {
            if (err) {
                // If there is an error, pass it back to the manager
                console.error("Error fetching products:", err);
                return callback(err, null);
            }
            // If successful, pass the 'rows' (the array of data) back
            return callback(null, rows);
        });
    },

    // --- FUNCTION 2: Add a brand new product to the database ---
    // 'productData' will be an object containing the info typed into the frontend form
    createProduct: (productData, callback) => {
        
        // We use ? as placeholders to safely insert data and prevent SQL injection
        const sql = `
            INSERT INTO products (item_code, item_name, cost_price, srp, current_stock) 
            VALUES (?, ?, ?, ?, ?)
        `;

        // We package the exact values into an array that matches the order of the ? marks
        const values = [
            productData.item_code, 
            productData.item_name, 
            productData.cost_price, 
            productData.srp, 
            productData.current_stock
        ];

        // db.run executes the INSERT action
        db.run(sql, values, function(err) {
            if (err) {
                console.error("Error adding product:", err);
                return callback(err, null);
            }
            // 'this.lastID' is a special SQLite variable that returns the ID of the new row
            // We pass it back so the server knows the insert was successful
            return callback(null, { message: "Product added successfully!" });
        });
    }
};

// 3. Export this object so the Controller can use it
module.exports = ProductModel;