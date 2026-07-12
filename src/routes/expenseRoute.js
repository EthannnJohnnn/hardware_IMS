const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyAdminPin } = require('../middleware/authMiddleware'); // ✨ NEW Gatekeeper

// The Traffic Cop: Clean and readable!
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.addExpense);

router.put('/edit', verifyAdminPin, expenseController.editExpense);
router.delete('/delete', expenseController.deleteExpense);

module.exports = router;