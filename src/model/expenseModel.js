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

    // ✨ PHASE 35: Filter Expenses by Timeframe
    getAllExpenses: (filter, callback) => {
        let sql = `SELECT * FROM expenses`;
        
        // Dynamically add the timeframe filter
        if (filter === 'daily') {
            sql += ` WHERE DATE(expense_date) = DATE('now', 'localtime')`;
        } else if (filter === 'weekly') {
            sql += ` WHERE DATE(expense_date) >= DATE('now', '-7 days', 'localtime')`;
        } else if (filter === 'monthly') {
            sql += ` WHERE DATE(expense_date) >= DATE('now', '-30 days', 'localtime')`;
        }
        
        sql += ` ORDER BY expense_date DESC, id DESC`;

        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
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