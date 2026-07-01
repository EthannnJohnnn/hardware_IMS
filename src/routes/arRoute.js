const express = require('express');
const router = express.Router();
const arController = require('../controllers/arController');

// The Traffic Cop
router.get('/', arController.getDebts);
router.post('/', arController.addDebt);

// Note: If your frontend uses a PUT or POST request to pay a debt, this catches it based on the ID
router.put('/:id/pay', arController.markPaid); 
router.post('/:id/pay', arController.markPaid); 

module.exports = router;