const express = require('express');
const router = express.Router();
const ExpenseModel = require('../model/expenseModel');

// GET /api/expenses -> Fetch all expenses
router.get('/', (req, res) => {
    ExpenseModel.getAllExpenses((err, data) => {
        if (err) return res.status(500).json({ error: "Failed to load expenses" });
        res.json(data);
    });
});

// POST /api/expenses -> Save a new expense
router.post('/', (req, res) => {
    ExpenseModel.addExpense(req.body, (err) => {
        if (err) return res.status(500).json({ error: "Failed to save expense" });
        res.json({ message: "Expense recorded successfully!" });
    });
});

module.exports = router;