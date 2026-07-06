const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);

// ✨ THE NEW TRANSFER ROUTE IS HERE ✨
router.put('/products/adjust', productController.adjustStock);

module.exports = router;