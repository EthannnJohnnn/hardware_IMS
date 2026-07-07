const db = require('../config/database');

const ExchangeModel = {
    processExchange: (data, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // 1. Add the returned item back into stock
            db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, 
            [data.returned_qty, data.returned_item_code], function(err) {
                if(err) { db.run("ROLLBACK"); return callback(err, null); }

                // 2. Deduct the newly taken item from stock
                db.run(`UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`, 
                [data.taken_qty, data.taken_item_code], function(err) {
                    if(err) { db.run("ROLLBACK"); return callback(err, null); }

                    // 3. Log the Exchange
                    const sql = `INSERT INTO exchanges (returned_item_code, returned_qty, taken_item_code, taken_qty, cash_top_up) VALUES (?, ?, ?, ?, ?)`;
                    db.run(sql, [data.returned_item_code, data.returned_qty, data.taken_item_code, data.taken_qty, data.cash_top_up], function(err) {
                        if(err) { db.run("ROLLBACK"); return callback(err, null); }

                        // 4. Force the Cash into the Sales Ledger
                        if (data.cash_top_up > 0) {
                            // Check if our Phantom Product exists
                            db.get(`SELECT item_code FROM products WHERE item_code = 'EXCHANGE'`, (err, row) => {
                                if (!row) {
                                    // Silently create the phantom product with an SRP of 1
                                    db.run(`INSERT INTO products (item_code, item_name, cost_price, srp, current_stock) VALUES ('EXCHANGE', 'Cash Top-Up (Item Exchange)', 0, 1, 0)`, finishSale);
                                } else {
                                    finishSale();
                                }

                                function finishSale() {
                                    // Insert the cash amount as the quantity
                                    db.run(`INSERT INTO sales (item_code, quantity) VALUES ('EXCHANGE', ?)`, [data.cash_top_up], function(err) {
                                        if(err) { db.run("ROLLBACK"); return callback(err, null); }
                                        db.run("COMMIT"); 
                                        callback(null, { message: "Exchange processed and Revenue tracked!" });
                                    });
                                }
                            });
                        } else {
                            db.run("COMMIT");
                            callback(null, { message: "Exchange successfully processed!" });
                        }
                    });
                });
            });
        });
    }
};

module.exports = ExchangeModel;