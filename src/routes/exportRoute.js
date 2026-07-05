const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.get('/sales', exportController.exportSalesLedger);
// ✨ NEW URL for Purchases
router.get('/purchases', exportController.exportPurchaseLedger); 

module.exports = router;