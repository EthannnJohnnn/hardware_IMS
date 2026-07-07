const RepackModel = require('../model/repackModel');

const repackController = {
    createRepack: (req, res) => {
        const { source_item_code, source_qty, result_item_code, result_qty } = req.body;

        if (!source_item_code || !result_item_code || source_qty <= 0 || result_qty <= 0) {
            return res.status(400).json({ error: "Invalid repack data." });
        }

        RepackModel.processRepack(req.body, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to process repackaging." });
            res.json(result);
        });
    }
};

module.exports = repackController;