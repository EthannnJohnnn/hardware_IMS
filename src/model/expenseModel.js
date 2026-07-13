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
    },

    updateExpense: (id, description, amount, callback) => {
        // FIXED: Changed table name from 'operating_expenses' to 'expenses'
        const sql = `UPDATE expenses SET description = ?, amount = ? WHERE id = ?`;
        
        db.run(sql, [description, amount, id], function(err) {
            if (err) {
                console.error("Database error in updateExpense:", err);
                return callback(err);
            }
            callback(null, { changes: this.changes });
        });
    },

    // --- Delete Operating Expense ---
    deleteExpense: (id, callback) => {
        // We only need the ID, no need to touch the products table!
        db.run(`DELETE FROM expenses WHERE id = ?`, [id], function(err) {
            if (err) return callback(err, null);
            return callback(null, { message: "Operating expense deleted successfully!" });
        });
    }
};

module.exports = ExpenseModel;