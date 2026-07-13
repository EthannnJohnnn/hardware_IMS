const ExchangeModel = require('../model/exchangeModel');

const exchangeController = {
    createExchange: (req, res) => {
        const { returned_item_code, returned_qty, taken_item_code, taken_qty, cash_top_up } = req.body;

        // 1. Convert incoming quantities and cash to safe decimals
        const decimalReturnedQty = parseFloat(returned_qty);
        const decimalTakenQty = parseFloat(taken_qty);
        const decimalCashTopUp = parseFloat(cash_top_up);

        // 2. Validate using the new decimal numbers
        if (!returned_item_code || !taken_item_code || isNaN(decimalReturnedQty) || decimalReturnedQty <= 0 || isNaN(decimalTakenQty) || decimalTakenQty <= 0 || isNaN(decimalCashTopUp) || decimalCashTopUp < 0) {
            return res.status(400).json({ error: "Invalid exchange data. Check quantities and items." });
        }

        // 3. Update req.body with the mathematical decimals before passing it to the model
        req.body.returned_qty = decimalReturnedQty;
        req.body.taken_qty = decimalTakenQty;
        req.body.cash_top_up = decimalCashTopUp;

        ExchangeModel.processExchange(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to process exchange." });
            res.json(result);
        });
    }
};

module.exports = exchangeController;