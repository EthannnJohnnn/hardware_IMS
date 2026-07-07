const ExchangeModel = require('../model/exchangeModel');

const exchangeController = {
    createExchange: (req, res) => {
        const { returned_item_code, returned_qty, taken_item_code, taken_qty, cash_top_up } = req.body;

        if (!returned_item_code || !taken_item_code || returned_qty <= 0 || taken_qty <= 0 || cash_top_up < 0) {
            return res.status(400).json({ error: "Invalid exchange data. Check quantities and items." });
        }

        ExchangeModel.processExchange(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to process exchange." });
            res.json(result);
        });
    }
};

module.exports = exchangeController;