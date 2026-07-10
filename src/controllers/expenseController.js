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
    },

    // Add this inside your existing controller object
    editExpense: (req, res) => {
        const { id, description, amount } = req.body;
        
        // We assume expenseModel.updateExpense will be built in Phase 21
        expenseModel.updateExpense(id, description, amount, (err, data) => {
            if (err) {
                console.error("Error updating expense:", err);
                return res.status(500).json({ error: "Failed to update expense" });
            }
            res.json({ message: "Expense updated successfully" });
        });
    }
};

module.exports = expenseController;