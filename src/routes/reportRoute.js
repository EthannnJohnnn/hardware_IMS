const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/summary', reportController.getSummary);
router.get('/daily', reportController.getDaily);

module.exports = router;