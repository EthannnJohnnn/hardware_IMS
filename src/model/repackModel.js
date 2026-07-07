const db = require('../config/database');

const RepackModel = {
    processRepack: (data, callback) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // 1. Deduct the Bulk Source Item (e.g., -1 Box of Nails)
            db.run(`UPDATE products SET current_stock = current_stock - ? WHERE item_code = ?`, 
            [data.source_qty, data.source_item_code], function(err) {
                if(err) { db.run("ROLLBACK"); return callback(err, null); }

                // 2. Add the Retail Result Item (e.g., +20 Kilos of Nails)
                db.run(`UPDATE products SET current_stock = current_stock + ? WHERE item_code = ?`, 
                [data.result_qty, data.result_item_code], function(err) {
                    if(err) { db.run("ROLLBACK"); return callback(err, null); }

                    // 3. Log the audit trail in the Repacks table
                    const sql = `INSERT INTO repacks (source_item_code, source_qty, result_item_code, result_qty) VALUES (?, ?, ?, ?)`;
                    db.run(sql, [data.source_item_code, data.source_qty, data.result_item_code, data.result_qty], function(err) {
                        if(err) { db.run("ROLLBACK"); return callback(err, null); }

                        db.run("COMMIT"); // Lock it in!
                        callback(null, { message: "Inventory successfully repackaged!" });
                    });
                });
            });
        });
    }
};

module.exports = RepackModel;