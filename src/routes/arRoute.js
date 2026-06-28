const express = require('express');
const router = express.Router();
const ARModel = require('../model/arModel');

// GET /api/ar -> Fetch unpaid debts
router.get('/', (req, res) => {
    ARModel.getUnpaidDebts((err, data) => {
        if (err) return res.status(500).json({ error: "Failed to fetch AR data" });
        res.json(data);
    });
});

// POST /api/ar -> Log a new debt
router.post('/', (req, res) => {
    ARModel.addDebt(req.body, (err) => {
        if (err) return res.status(500).json({ error: "Failed to log debt" });
        res.json({ message: "Debt recorded successfully" });
    });
});

// PUT /api/ar/:id/pay -> Mark a specific debt as Paid
router.put('/:id/pay', (req, res) => {
    ARModel.markAsPaid(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: "Failed to update debt" });
        res.json({ message: "Debt marked as paid" });
    });
});

module.exports = router;