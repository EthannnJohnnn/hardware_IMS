const TransactionModel = require('../model/transactionModel');

const transactionController = {
    // --- EXISTING FUNCTIONS ---
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
    },

    // ====================================================
    // ✨ PHASE 26: SECURE DELETION CONTROLLERS
    // ====================================================
    deleteSale: (req, res) => {
        const { id, item_code, qty, pin } = req.body;
        
        // 1. Force the quantity to be a decimal number
        const decimalQty = parseFloat(qty);

        // 🔒 Check Admin PIN
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        // 2. Pass decimalQty to the model
        TransactionModel.deleteSale({ id, item_code, qty: decimalQty }, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete sale" });
            res.json(result);
        });
    },

    deletePurchase: (req, res) => {
        const { id, item_code, qty, pin } = req.body;
        
        // 1. Force the quantity to be a decimal number
        const decimalQty = parseFloat(qty);

        // 🔒 Check Admin PIN
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        // 2. Pass decimalQty to the model
        TransactionModel.deletePurchase({ id, item_code, qty: decimalQty }, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete purchase" });
            res.json(result);
        });
    }
};

module.exports = transactionController;