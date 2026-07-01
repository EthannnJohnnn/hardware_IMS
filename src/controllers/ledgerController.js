const LedgerModel = require('../model/ledgerModel');

const ledgerController = {
    getSales: (req, res) => {
        LedgerModel.getSalesLedger((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch sales ledger" });
            res.json(data);
        });
    },
    getPurchases: (req, res) => {
        LedgerModel.getPurchaseLedger((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch purchase ledger" });
            res.json(data);
        });
    }
};

module.exports = ledgerController;