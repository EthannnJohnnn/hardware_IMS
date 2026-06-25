// 1. Import Express and set up the Router (The Menu)
const express = require('express');
const router = express.Router();

// 2. Import our Kitchen (The Models we just built)
const ProductModel = require('../model/productModel');
const TransactionModel = require('../model/transactionModel');

// --- THE MENU ITEMS ---

// GET /api/products -> Fetches all items for the inventory table
router.get('/products', (req, res) => {
    ProductModel.getAllProducts((err, data) => {
        if (err) {
            // Send a 500 (Server Error) status to the frontend
            return res.status(500).json({ error: "Failed to get products" });
        }
        // Send the array of SQLite data back as JSON
        res.json(data);
    });
});

// POST /api/products -> Adds a new hardware item
router.post('/products', (req, res) => {
    const productData = req.body; // This grabs the data typed into the HTML form
    
    ProductModel.createProduct(productData, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to add product" });
        res.json(result);
    });
});

// POST /api/transactions/sale -> Records a sale and subtracts stock
router.post('/transactions/sale', (req, res) => {
    const saleData = req.body;

    TransactionModel.recordSale(saleData, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to record sale" });
        res.json(result);
    });
});

// POST /api/transactions/purchase -> Records a restock and adds stock
router.post('/transactions/purchase', (req, res) => {
    const purchaseData = req.body;

    TransactionModel.recordPurchase(purchaseData, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to record purchase" });
        res.json(result);
    });
});

// 3. Export the Router
module.exports = router;