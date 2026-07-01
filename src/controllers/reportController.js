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
    }
};

module.exports = reportController;