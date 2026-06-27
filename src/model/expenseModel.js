// src/model/expenseModel.js
const db = require('../config/database');

const ExpenseModel = {
    // 1. Log a new expense (e.g., Payroll, Utilities)
    addExpense: (expenseData, callback) => {
        const sql = `INSERT INTO expenses (description, amount) VALUES (?, ?)`;
        
        db.run(sql, [expenseData.description, expenseData.amount], function(err) {
            if (err) {
                console.error("Error adding expense:", err);
                return callback(err, null);
            }
            return callback(null, { message: "Expense logged successfully!" });
        });
    },

    // 2. Get all expenses (for our future reports)
    getAllExpenses: (callback) => {
        const sql = `SELECT * FROM expenses ORDER BY expense_date DESC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Error fetching expenses:", err);
                return callback(err, null);
            }
            return callback(null, rows);
        });
    }
};

module.exports = ExpenseModel;