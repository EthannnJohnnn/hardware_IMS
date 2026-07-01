const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// The Traffic Cop: Clean and readable!
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.addExpense);

module.exports = router;