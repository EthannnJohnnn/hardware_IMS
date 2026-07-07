const LedgerModel = require('../model/ledgerModel');

// 1. Tell Node to load the hidden .env file
require('dotenv').config();

// 2. Grab the PIN from the hidden file (with a fallback just in case)
const ADMIN_PIN = process.env.ADMIN_PIN;

const adminController = {
    verifyPin: (req, res) => {
        const { pin } = req.body;
        if (pin === ADMIN_PIN) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: "Unauthorized. Incorrect PIN." });
        }
    },
    
    updateSale: (req, res) => {
        LedgerModel.editSale(req.params.id, req.body.quantity, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to update sale." });
            res.json(result);
        });
    },

    updatePurchase: (req, res) => {
        LedgerModel.editPurchase(req.params.id, req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to update purchase." });
            res.json(result);
        });
    }
};

module.exports = adminController;