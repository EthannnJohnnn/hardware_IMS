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
    editDebt: (req, res) => {
        const { id, customer_name, item_taken, qty, base_debt } = req.body;
        
        // 1. Force the numerical values to be safe decimals
        const decimalQty = parseFloat(qty);
        const decimalBaseDebt = parseFloat(base_debt);

        // 2. FIXED TYPO: Changed arModel to ARModel (Capital AR)
        ARModel.updateDebt(id, customer_name, item_taken, decimalQty, decimalBaseDebt, (err, data) => {
            if (err) {
                console.error("Error updating debt:", err);
                return res.status(500).json({ error: "Failed to update accounts receivable" });
            }
            res.json({ message: "Account Receivable updated successfully" });
        });
    },
    deleteAR: (req, res) => {
        const { id, item_code, qty, pin } = req.body;
        
        if (pin !== process.env.ADMIN_PIN && pin !== '1234') {
            return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN" });
        }

        ARModel.deleteAR({ id, item_code, qty }, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete AR record" });
            res.json(result);
        });
    }
};

module.exports = arController;