const RepackModel = require('../model/repackModel');

const repackController = {
    createRepack: (req, res) => {
        const { source_item_code, source_qty, result_item_code, result_qty } = req.body;

        // 1. Convert incoming quantities to safe decimals
        const decimalSourceQty = parseFloat(source_qty);
        const decimalResultQty = parseFloat(result_qty);

        // 2. Validate using the new decimal numbers
        if (!source_item_code || !result_item_code || isNaN(decimalSourceQty) || decimalSourceQty <= 0 || isNaN(decimalResultQty) || decimalResultQty <= 0) {
            return res.status(400).json({ error: "Invalid repack data." });
        }

        // 3. Update req.body with the mathematical decimals
        req.body.source_qty = decimalSourceQty;
        req.body.result_qty = decimalResultQty;

        RepackModel.processRepack(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to process repackaging." });
            res.json(result);
        });
    }
};

module.exports = repackController;