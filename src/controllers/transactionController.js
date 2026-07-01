const TransactionModel = require('../model/transactionModel');

const transactionController = {
    recordSale: (req, res) => {
        TransactionModel.recordSale(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to record sale" });
            res.json(result);
        });
    },
    recordPurchase: (req, res) => {
        TransactionModel.recordPurchase(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to record purchase" });
            res.json(result);
        });
    }
};

module.exports = transactionController;