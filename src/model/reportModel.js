const db = require('../config/database');

const ReportModel = {
    // 1. Weekly & Monthly Summary (Fixed Net Profit & COGS)
    getSummaryByDate: (startDate, endDate, callback) => {
        const summary = { 
            total_sales: 0, 
            total_cogs: 0, 
            total_expenses: 0, 
            net_amount: 0, 
            current_inventory_value: 0 
        };
        
        // Calculate Revenue and COGS only for items actually sold
        const salesQuery = `SELECT SUM(s.quantity * p.srp) as revenue, SUM(s.quantity * p.cost_price) as cogs FROM sales s JOIN products p ON s.item_code = p.item_code WHERE DATE(s.sale_date) BETWEEN ? AND ?`;
        const expQuery = `SELECT SUM(amount) as total FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?`;
        
        // ✨ PHASE 31: Total Inventory Value Query
        const invQuery = `SELECT SUM(current_stock * cost_price) as total FROM products`;

        db.get(salesQuery, [startDate, endDate], (err, salesRow) => {
            if (!err && salesRow) {
                summary.total_sales = salesRow.revenue || 0;
                summary.total_cogs = salesRow.cogs || 0;
            }
            db.get(expQuery, [startDate, endDate], (err, expRow) => {
                if (!err && expRow && expRow.total) summary.total_expenses = expRow.total;
                
                db.get(invQuery, [], (err, invRow) => {
                    if (!err && invRow && invRow.total) summary.current_inventory_value = invRow.total;

                    // REAL NET PROFIT = Revenue - Cost of Goods Sold - Expenses
                    summary.net_amount = summary.total_sales - summary.total_cogs - summary.total_expenses;
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

    // 3. Purchase Aggregation
    getAggregatedPurchases: (type, callback) => {
        let sql = '';
        if (type === 'monthly') {
            sql = `SELECT strftime('%Y-%m', purchase_date) as date, SUM(quantity * cost_price) as total_cost FROM purchases GROUP BY strftime('%Y-%m', purchase_date) ORDER BY strftime('%Y-%m', purchase_date) DESC`;
        } else {
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

    // 4. Top Sellers
    getTopSellers: (callback) => {
        const sql = `
            SELECT p.item_name, SUM(s.quantity) AS total_sold
            FROM sales s
            JOIN products p ON s.item_code = p.item_code
            WHERE p.item_name != 'Cash Top-Up (Item Exchange)' 
            GROUP BY s.item_code
            ORDER BY total_sold DESC
            LIMIT 5
        `;
        db.all(sql, [], (err, rows) => callback(err, rows));
    },

    // 5. Worst Sellers
    getWorstSellers: (callback) => {
        const sql = `
            SELECT p.item_name, COALESCE(SUM(s.quantity), 0) AS total_sold
            FROM products p
            LEFT JOIN sales s ON p.item_code = s.item_code
            WHERE p.item_name != 'Cash Top-Up (Item Exchange)'
            GROUP BY p.item_code
            ORDER BY total_sold ASC
            LIMIT 5
        `;
        db.all(sql, [], (err, rows) => callback(err, rows));
    }
};

module.exports = ReportModel;