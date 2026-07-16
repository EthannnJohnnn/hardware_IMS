const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/sales', ledgerController.getSales);
router.get('/purchases', ledgerController.getPurchases);
router.put('/sales/edit', ledgerController.editSaleTransaction);

module.exports = router;