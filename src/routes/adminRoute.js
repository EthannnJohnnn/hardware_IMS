const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/verify', adminController.verifyPin);
router.put('/sales/:id', adminController.updateSale);
router.put('/purchases/:id', adminController.updatePurchase);

module.exports = router;