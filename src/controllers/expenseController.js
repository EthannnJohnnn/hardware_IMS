const ExpenseModel = require('../model/expenseModel');

const expenseController = {
    getExpenses: (req, res) => {
        const filter = req.query.filter || 'all_time'; // Default to all_time if no filter
        ExpenseModel.getAllExpenses(filter, (err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch expenses" });
            res.json(data);
        });
    },
    addExpense: (req, res) => {
        ExpenseModel.addExpense(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to log expense" });
            res.json(result);
        });
    },
    editExpense: (req, res) => {
        const { id, description, amount } = req.body;
        
        // 1. Force the amount to be a safe decimal
        const decimalAmount = parseFloat(amount);

        // 2. FIXED TYPO: Changed expenseModel to ExpenseModel (Capital E)
        ExpenseModel.updateExpense(id, description, decimalAmount, (err, data) => {
            if (err) {
                console.error("Error updating expense:", err);
                return res.status(500).json({ error: "Failed to update expense" });
            }
            res.json({ message: "Expense updated successfully" });
        });
    },
    deleteExpense: (req, res) => {
        const { id, pin } = req.body;
        
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        ExpenseModel.deleteExpense(id, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete expense" });
            res.json(result);
        });
    }
};

module.exports = expenseController;