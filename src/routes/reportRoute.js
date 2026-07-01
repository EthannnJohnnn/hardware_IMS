// src/routes/reportRoute.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/summary', reportController.getSummary);
router.get('/daily', reportController.getDaily);

// ✨ NEW STEP 2: The Traffic Cop for the Aggregation API
router.get('/purchases', reportController.getPurchasesAggregation);

module.exports = router;