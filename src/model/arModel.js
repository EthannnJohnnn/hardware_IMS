// src/model/arModel.js
const db = require('../config/database');

const ARModel = {
    // 1. Record a new customer debt
    addDebt: (arData, callback) => {
        const sql = `INSERT INTO accounts_receivable (customer_name, description, amount) VALUES (?, ?, ?)`;
        
        db.run(sql, [arData.customer_name, arData.description, arData.amount], function(err) {
            if (err) {
                console.error("Error adding debt record:", err);
                return callback(err, null);
            }
            return callback(null, { message: "Debt recorded successfully!" });
        });
    },

    // 2. Fetch all unpaid debts to display on the dashboard
    // 2. Fetch ALL debts to display on the dashboard (Paid & Unpaid)
    getUnpaidDebts: (callback) => {
        // THE FIX: We removed the WHERE filter so it grabs every historical record
        const sql = `SELECT * FROM accounts_receivable ORDER BY date_issued DESC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Error fetching debts:", err);
                return callback(err, null);
            }
            return callback(null, rows);
        });
    },

    // 3. Mark a debt as 'Paid' when the customer hands over the cash!
    markAsPaid: (id, callback) => {
        const sql = `UPDATE accounts_receivable SET status = 'Paid' WHERE id = ?`;
        
        db.run(sql, [id], function(err) {
            if (err) {
                console.error("Error updating debt status:", err);
                return callback(err, null);
            }
            return callback(null, { message: "Debt marked as Paid!" });
        });
    }
};

module.exports = ARModel;