const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAdminPin } = require('../middleware/authMiddleware'); // ✨ NEW Gatekeeper

router.get('/products/paginated', productController.getPaginatedInventory);
router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);

router.put('/products/adjust', productController.adjustStock);
router.put('/products/edit', verifyAdminPin, productController.editInventory);

module.exports = router;