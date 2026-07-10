const ARModel = require('../model/arModel');

const arController = {
    getAllAR: (req, res) => {
        ARModel.getAllAR((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch AR records" });
            res.json(data);
        });
    },
    addDebt: (req, res) => {
        const { customer_name, item_code, qty } = req.body;
        
        // Validation for the new inventory-based parameters
        if (!customer_name || !item_code || !qty || qty <= 0) {
            return res.status(400).json({ error: "Invalid debt parameters. Ensure all fields are filled correctly." });
        }
        
        ARModel.addDebt({ customer_name, item_code, qty }, (err, result) => {
            if (err) return res.status(500).json({ error: err.message || "Failed to add debt" });
            res.json(result);
        });
    },
    markAsPaid: (req, res) => {
        ARModel.markAsPaid(req.params.id, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to update debt status" });
            res.json(result);
        });
    },
    // Add this inside your existing controller object
    editDebt: (req, res) => {
        const { id, customer_name, item_taken, qty, base_debt } = req.body;
        
        // We assume arModel.updateDebt will be built in Phase 21
        arModel.updateDebt(id, customer_name, item_taken, qty, base_debt, (err, data) => {
            if (err) {
                console.error("Error updating debt:", err);
                return res.status(500).json({ error: "Failed to update accounts receivable" });
            }
            res.json({ message: "Account Receivable updated successfully" });
        });
    }
};

module.exports = arController;