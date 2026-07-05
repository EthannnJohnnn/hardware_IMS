const ExcelJS = require('exceljs');
const LedgerModel = require('../model/ledgerModel');

const exportController = {
    exportSalesLedger: (req, res) => {
        /* ... (Keep your existing sales code exactly as it is) ... */
    },
    
    // ✨ NEW: The Purchase Ledger Export
    exportPurchaseLedger: (req, res) => {
        LedgerModel.getPurchaseLedger(async (err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch purchase data" });

            try {
                const workbook = new ExcelJS.Workbook();
                workbook.creator = 'MaxC Hardware IMS';
                const worksheet = workbook.addWorksheet('Purchase Ledger');

                // Define columns matching the Purchase table
                worksheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Item Code', key: 'item_code', width: 15 },
                    { header: 'Item Name', key: 'item_name', width: 35 },
                    { header: 'Cost Price (PHP)', key: 'cost_price', width: 18 },
                    { header: 'Qty Purchased', key: 'qty_purchased', width: 15 },
                    { header: 'Total Cost (PHP)', key: 'total_cost', width: 20 },
                    { header: 'Supplier', key: 'supplier', width: 25 }
                ];

                // Style the Header Row (Blue background for purchases to differentiate from sales)
                worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };

                // Insert the data
                worksheet.addRows(data);

                // Force browser download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=MaxC_Purchase_Ledger.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error("Excel Generation Error:", error);
                res.status(500).json({ error: "Failed to generate Excel file" });
            }
        });
    }
};

module.exports = exportController;