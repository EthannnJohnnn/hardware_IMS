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

    // ✨ PHASE 20: EDIT INVENTORY CONTROLLER ✨
    // ✨ PHASE 20: EDIT INVENTORY CONTROLLER (FIXED) ✨
    editInventory: (req, res) => {
        const { original_item_code, item_code, item_name, cost_price, srp } = req.body;
        
        ProductModel.updateProduct(original_item_code, item_code, item_name, cost_price, srp, (err, data) => {
            if (err) {
                console.error("Error updating inventory:", err);
                return res.status(500).json({ error: "Failed to update item" });
            }
            res.json({ message: "Inventory updated successfully" });
        });
    }
};

module.exports = productController;