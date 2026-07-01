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
    }
};

module.exports = productController;