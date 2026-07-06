const express = require('express');
const router = express.Router();
const arController = require('../controllers/arController');

// Updated to match the new controller function names!
router.get('/', arController.getAllAR);
router.post('/', arController.addDebt);
router.put('/:id/pay', arController.markAsPaid);

module.exports = router;