// src/model/reportModel.js
const db = require('../config/database');

const ReportModel = {

    // [x] CHECKLIST ITEM 3: Weekly & Monthly Summary (with Date Filtering)
    getSummaryByDate: (startDate, endDate, callback) => {
        const summary = { total_sales: 0, total_purchases: 0, total_expenses: 0, net_amount: 0 };

        const salesQuery = `
            SELECT SUM(s.quantity * p.srp) as total 
            FROM sales s JOIN products p ON s.item_code = p.item_code
            WHERE DATE(s.sale_date) BETWEEN ? AND ?`;

        const purchQuery = `SELECT SUM(quantity * cost_price) as total FROM purchases WHERE DATE(purchase_date) BETWEEN ? AND ?`;
        const expQuery = `SELECT SUM(amount) as total FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?`;

        // Run queries sequentially passing the start and end dates
        db.get(salesQuery, [startDate, endDate], (err, salesRow) => {
            if (!err && salesRow.total) summary.total_sales = salesRow.total;

            db.get(purchQuery, [startDate, endDate], (err, purchRow) => {
                if (!err && purchRow.total) summary.total_purchases = purchRow.total;

                db.get(expQuery, [startDate, endDate], (err, expRow) => {
                    if (!err && expRow.total) summary.total_expenses = expRow.total;

                    // Calculate Net Amount for this specific timeframe
                    summary.net_amount = summary.total_sales - summary.total_purchases - summary.total_expenses;
                    return callback(null, summary);
                });
            });
        });
    },

    // [x] CHECKLIST ITEMS 1 & 2: Daily Sales Grouping & COGS Calculation
    getDailySalesReport: (startDate, endDate, callback) => {
        // This query does the heavy lifting: It groups by day, calculates revenue, 
        // subtracts the specific Cost of Goods Sold (COGS), and gives you Gross Profit.
        const sql = `
            SELECT 
                DATE(s.sale_date) as report_date,
                SUM(s.quantity) as items_sold,
                SUM(s.quantity * p.cost_price) as total_cogs,
                SUM(s.quantity * p.srp) as total_revenue,
                (SUM(s.quantity * p.srp) - SUM(s.quantity * p.cost_price)) as gross_profit
            FROM sales s
            JOIN products p ON s.item_code = p.item_code
            WHERE DATE(s.sale_date) BETWEEN ? AND ?
            GROUP BY DATE(s.sale_date)
            ORDER BY DATE(s.sale_date) DESC
        `;

        db.all(sql, [startDate, endDate], (err, rows) => {
            if (err) {
                console.error("Error generating daily report:", err);
                return callback(err, null);
            }
            return callback(null, rows);
        });
    }
};

module.exports = ReportModel;