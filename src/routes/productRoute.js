const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAdminPin } = require('../middleware/authMiddleware'); // ✨ NEW Gatekeeper

router.get('/products', productController.getAllProducts);
router.post('/products', productController.createProduct);

// The Transfer Route
router.put('/products/adjust', productController.adjustStock);

// ✨ NEW: Phase 20 Protected Edit Route
router.put('/products/edit', verifyAdminPin, productController.editInventory);

module.exports = router;