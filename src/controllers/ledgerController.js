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
    },

    // ✨ NEW PHASE 37 CONTROLLER
    editSaleTransaction: (req, res) => {
        const { id, newQty, newPrice, newDiscount, pin } = req.body;

        // Verify Admin PIN 
        if (pin !== process.env.ADMIN_PIN) { 
            return res.status(403).json({ error: "Invalid Admin PIN. Access Denied." });
        }

        const data = { newQty, newPrice, newDiscount };

        // We removed the duplicate require() line here. It now correctly uses the one from Line 1!
        LedgerModel.editSale(id, data, (err, result) => {
            if (err) return res.status(500).json({ error: "Database error during update." });
            res.json(result);
        });
    },

    getRepacks: (req, res) => {
        const filter = req.query.filter || 'all';
        LedgerModel.getRepackHistory(filter, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to load repacks" });
            res.json(result);
        });
    },

    getExchanges: (req, res) => {
        const filter = req.query.filter || 'all';
        LedgerModel.getExchangeHistory(filter, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to load exchanges" });
            res.json(result);
        });
    }
};

module.exports = ledgerController;