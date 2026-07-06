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
    
    // ✨ THE NEW TRANSFER LOGIC IS HERE ✨
    adjustStock: (req, res) => {
        const { item_code, action, qty } = req.body;
        if (!item_code || !action || !qty || qty <= 0) {
            return res.status(400).json({ error: "Invalid adjustment parameters." });
        }
        ProductModel.adjustStock(item_code, action, qty, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to adjust stock." });
            res.json(result);
        });
    }
};

module.exports = productController;