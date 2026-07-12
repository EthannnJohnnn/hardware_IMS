const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/sale', transactionController.recordSale);
router.post('/purchase', transactionController.recordPurchase);
router.delete('/sale', transactionController.deleteSale);
router.delete('/purchase', transactionController.deletePurchase);

module.exports = router;