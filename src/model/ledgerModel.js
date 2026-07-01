const db = require('../config/database');

const LedgerModel = {
    getSalesLedger: (callback) => {
        const sql = `
            SELECT s.sale_date AS date, s.item_code, p.item_name, p.srp AS unit_price, s.quantity AS qty_sold, (p.srp * s.quantity) AS total_sales
            FROM sales s
            JOIN products p ON s.item_code = p.item_code
            ORDER BY s.sale_date DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            callback(null, rows);
        });
    },
    getPurchaseLedger: (callback) => {
        const sql = `
            SELECT pu.purchase_date AS date, pu.item_code, p.item_name, pu.cost_price, pu.quantity AS qty_purchased, (pu.cost_price * pu.quantity) AS total_cost, pu.supplier
            FROM purchases pu
            JOIN products p ON pu.item_code = p.item_code
            ORDER BY pu.purchase_date DESC
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return callback(err, null);
            callback(null, rows);
        });
    }
};

module.exports = LedgerModel;