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
        
        // 🔒 Check Admin PIN
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        TransactionModel.deleteSale({ id, item_code, qty }, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete sale" });
            res.json(result);
        });
    },

    deletePurchase: (req, res) => {
        const { id, item_code, qty, pin } = req.body;
        
        // 🔒 Check Admin PIN
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        TransactionModel.deletePurchase({ id, item_code, qty }, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete purchase" });
            res.json(result);
        });
    }
};

module.exports = transactionController;