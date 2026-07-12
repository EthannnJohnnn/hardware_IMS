const LedgerModel = require('../model/ledgerModel');

const ledgerController = {
    getSales: (req, res) => {
        // Grab the filter from the URL, default to 'all' if none exists
        const filter = req.query.filter || 'all'; 
        
        LedgerModel.getSalesLedger(filter, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to load sales ledger" });
            res.json(result);
        });
    },

    getPurchases: (req, res) => {
        const filter = req.query.filter || 'all';
        
        LedgerModel.getPurchasesLedger(filter, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to load purchase ledger" });
            res.json(result);
        });
    }
};

module.exports = ledgerController;