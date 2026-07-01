const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/sales', ledgerController.getSales);
router.get('/purchases', ledgerController.getPurchases);

module.exports = router;