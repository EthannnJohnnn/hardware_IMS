const ProductModel = require('../model/productModel');

const productController = {
    getAllProducts: (req, res) => {
        ProductModel.getAllProducts((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to get products" });
            res.json(data);
        });
    },
    createProduct: (req, res) => {
        ProductModel.createProduct(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to add product" });
            res.json(result);
        });
    },
    
    adjustStock: (req, res) => {
        const { item_code, action, qty } = req.body;
        
        // 1. Convert the incoming quantity to a decimal number
        const decimalQty = parseFloat(qty);

        // 2. Check if it is valid
        if (!item_code || !action || isNaN(decimalQty) || decimalQty <= 0) {
            return res.status(400).json({ error: "Invalid adjustment parameters." });
        }

        // 3. Pass the safe decimal number to the model
        ProductModel.adjustStock(item_code, action, decimalQty, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to adjust stock." });
            res.json(result);
        });
    },

    editInventory: (req, res) => {
        // 1. Grab current_stock from the request body
        const { original_item_code, item_code, item_name, cost_price, srp, current_stock } = req.body;
        
        // 2. Force the stock to be a safe decimal (in case they type 1.5)
        const decimalStock = parseFloat(current_stock);

        if (isNaN(decimalStock) || decimalStock < 0) {
            return res.status(400).json({ error: "Invalid stock amount." });
        }
        
        // 3. Pass decimalStock into the model
        ProductModel.updateProduct(original_item_code, item_code, item_name, cost_price, srp, decimalStock, (err, data) => {
            if (err) {
                console.error("Error updating inventory:", err);
                return res.status(500).json({ error: "Failed to update item" });
            }
            res.json({ message: "Inventory updated successfully" });
        });
    },

    getPaginatedInventory: (req, res) => {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; 
        const offset = (page - 1) * limit;

        const ProductModel = require('../model/productModel'); 
        
        ProductModel.getInventoryPaginated(search, limit, offset, (err, result) => {
            if (err) {
                // ✨ ADDED LOGGER: This will print the exact SQL error to your VS Code terminal
                console.error("🚨 Pagination Database Error:", err.message); 
                return res.status(500).json({ error: "Failed to fetch paginated inventory" });
            }
            res.json(result);
        });
    },
};

module.exports = productController;