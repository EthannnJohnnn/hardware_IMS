// src/model/reportModel.js
const db = require('../config/database');

const ReportModel = {
    // 1. Weekly & Monthly Summary 
    getSummaryByDate: (startDate, endDate, callback) => {
        const summary = { total_sales: 0, total_purchases: 0, total_expenses: 0, net_amount: 0 };
        const salesQuery = `SELECT SUM(s.quantity * p.srp) as total FROM sales s JOIN products p ON s.item_code = p.item_code WHERE DATE(s.sale_date) BETWEEN ? AND ?`;
        const purchQuery = `SELECT SUM(quantity * cost_price) as total FROM purchases WHERE DATE(purchase_date) BETWEEN ? AND ?`;
        const expQuery = `SELECT SUM(amount) as total FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?`;

        db.get(salesQuery, [startDate, endDate], (err, salesRow) => {
            if (!err && salesRow && salesRow.total) summary.total_sales = salesRow.total;
            db.get(purchQuery, [startDate, endDate], (err, purchRow) => {
                if (!err && purchRow && purchRow.total) summary.total_purchases = purchRow.total;
                db.get(expQuery, [startDate, endDate], (err, expRow) => {
                    if (!err && expRow && expRow.total) summary.total_expenses = expRow.total;
                    summary.net_amount = summary.total_sales - summary.total_purchases - summary.total_expenses;
                    return callback(null, summary);
                });
            });
        });
    },

    // 2. Daily Sales Grouping
    getDailySalesReport: (startDate, endDate, callback) => {
        const sql = `
            SELECT DATE(s.sale_date) as report_date, SUM(s.quantity) as items_sold, SUM(s.quantity * p.cost_price) as total_cogs, SUM(s.quantity * p.srp) as total_revenue, (SUM(s.quantity * p.srp) - SUM(s.quantity * p.cost_price)) as gross_profit
            FROM sales s JOIN products p ON s.item_code = p.item_code WHERE DATE(s.sale_date) BETWEEN ? AND ? GROUP BY DATE(s.sale_date) ORDER BY DATE(s.sale_date) DESC
        `;
        db.all(sql, [startDate, endDate], (err, rows) => {
            if (err) return callback(err, null);
            return callback(null, rows);
        });
    },

    // ✨ NEW STEP 2: Purchase Aggregation (Daily or Monthly)
    getAggregatedPurchases: (type, callback) => {
        let sql = '';
        if (type === 'monthly') {
            // Groups by Year-Month (e.g., 2026-06)
            sql = `SELECT strftime('%Y-%m', purchase_date) as date, SUM(quantity * cost_price) as total_cost FROM purchases GROUP BY strftime('%Y-%m', purchase_date) ORDER BY strftime('%Y-%m', purchase_date) DESC`;
        } else {
            // Groups by exact Day (e.g., 2026-06-01)
            sql = `SELECT DATE(purchase_date) as date, SUM(quantity * cost_price) as total_cost FROM purchases GROUP BY DATE(purchase_date) ORDER BY DATE(purchase_date) DESC`;
        }

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Error aggregating purchases:", err);
                return callback(err, null);
            }
            return callback(null, rows);
        });
    },

// 1. Weekly & Monthly Summary (Now includes Current Inventory Value)
    getSummaryByDate: (startDate, endDate, callback) => {
        const summary = { total_sales: 0, total_purchases: 0, total_expenses: 0, net_amount: 0, current_inventory_value: 0 };
        
        const salesQuery = `SELECT SUM(s.quantity * p.srp) as total FROM sales s JOIN products p ON s.item_code = p.item_code WHERE DATE(s.sale_date) BETWEEN ? AND ?`;
        const purchQuery = `SELECT SUM(quantity * cost_price) as total FROM purchases WHERE DATE(purchase_date) BETWEEN ? AND ?`;
        const expQuery = `SELECT SUM(amount) as total FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?`;
        
        // THE FIX: Calculate the total cash currently locked in physical stock
        const invQuery = `SELECT SUM(current_stock * cost_price) as total FROM products`;

        // Run queries sequentially passing the start and end dates
        db.get(salesQuery, [startDate, endDate], (err, salesRow) => {
            if (!err && salesRow && salesRow.total) summary.total_sales = salesRow.total;
            db.get(purchQuery, [startDate, endDate], (err, purchRow) => {
                if (!err && purchRow && purchRow.total) summary.total_purchases = purchRow.total;
                db.get(expQuery, [startDate, endDate], (err, expRow) => {
                    if (!err && expRow && expRow.total) summary.total_expenses = expRow.total;
                    
                    // Run the inventory query (no dates needed for current stock)
                    db.get(invQuery, [], (err, invRow) => {
                        if (!err && invRow && invRow.total) summary.current_inventory_value = invRow.total;

                        // Calculate Net Amount
                        summary.net_amount = summary.total_sales - summary.total_purchases - summary.total_expenses;
                        return callback(null, summary);
                    });
                });
            });
        });
    }
    
};

module.exports = ReportModel;