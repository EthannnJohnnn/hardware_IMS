const ExpenseModel = require('../model/expenseModel');

const expenseController = {
    getExpenses: (req, res) => {
        // THE FIX: Changed from getExpenses to getAllExpenses to match your model exactly
        ExpenseModel.getAllExpenses((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch expenses" });
            res.json(data);
        });
    },
    addExpense: (req, res) => {
        ExpenseModel.addExpense(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to log expense" });
            res.json(result);
        });
    }
};

module.exports = expenseController;