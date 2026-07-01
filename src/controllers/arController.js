const ARModel = require('../model/arModel');

const arController = {
    getDebts: (req, res) => {
        // We use the model function we updated earlier to fetch all records
        ARModel.getUnpaidDebts((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch debts" });
            res.json(data);
        });
    },
    addDebt: (req, res) => {
        ARModel.addDebt(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to record debt" });
            res.json(result);
        });
    },
    markPaid: (req, res) => {
        // Grabs the ID from the URL (e.g., /api/ar/5/pay)
        const id = req.params.id || req.body.id; 
        ARModel.markAsPaid(id, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to update debt" });
            res.json(result);
        });
    }
};

module.exports = arController;