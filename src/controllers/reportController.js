// src/controllers/reportController.js
const ReportModel = require('../model/reportModel');

const reportController = {
    getSummary: (req, res) => {
        const startDate = req.query.start || '2000-01-01';
        const endDate = req.query.end || '2099-12-31';
        ReportModel.getSummaryByDate(startDate, endDate, (err, data) => {
            if (err) return res.status(500).json({ error: "Failed to generate summary report" });
            res.json(data);
        });
    },
    getDaily: (req, res) => {
        const startDate = req.query.start || '2000-01-01';
        const endDate = req.query.end || '2099-12-31';
        ReportModel.getDailySalesReport(startDate, endDate, (err, data) => {
            if (err) return res.status(500).json({ error: "Failed to generate daily report" });
            res.json(data);
        });
    },
    
    // ✨ NEW STEP 2: Process the type (daily or monthly) from the URL
    getPurchasesAggregation: (req, res) => {
        const type = req.query.type || 'daily'; // Default to daily if not provided
        ReportModel.getAggregatedPurchases(type, (err, data) => {
            if (err) return res.status(500).json({ error: "Failed to aggregate purchases" });
            res.json(data);
        });
    }
};

module.exports = reportController;