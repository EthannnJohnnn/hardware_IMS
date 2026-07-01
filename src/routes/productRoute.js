const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Clean, readable routes pointing to the controller!
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);

module.exports = router;