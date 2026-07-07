const ExcelJS = require('exceljs');
const LedgerModel = require('../model/ledgerModel');

const exportController = {
    // ==========================================
    // 1. EXPORT SALES LEDGER
    // ==========================================
    exportSalesLedger: (req, res) => {
        LedgerModel.getSalesLedger(async (err, data) => {
            if (err) {
                console.error("Sales DB Error:", err);
                return res.status(500).json({ error: "Failed to fetch sales data" });
            }

            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sales Ledger');

                worksheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Item Code', key: 'item_code', width: 15 },
                    { header: 'Item Name', key: 'item_name', width: 30 },
                    { header: 'Unit Price', key: 'unit_price', width: 15 },
                    { header: 'Qty Sold', key: 'qty_sold', width: 15 },
                    { header: 'Discount', key: 'discount', width: 15 },
                    { header: 'Total Sales', key: 'total_sales', width: 20 }
                ];

                worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                worksheet.addRows(data);

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=MaxC_Sales_Ledger.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error("Sales Excel Error:", error);
                if (!res.headersSent) res.status(500).json({ error: "Failed to generate Excel file" });
            }
        });
    },

    // ==========================================
    // 2. EXPORT PURCHASE LEDGER
    // ==========================================
    exportPurchaseLedger: (req, res) => {
        LedgerModel.getPurchaseLedger(async (err, data) => {
            if (err) {
                console.error("Purchase DB Error:", err);
                return res.status(500).json({ error: "Failed to fetch purchase data" });
            }

            try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Purchase Ledger');

                worksheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Item Code', key: 'item_code', width: 15 },
                    { header: 'Item Name', key: 'item_name', width: 35 },
                    { header: 'Cost Price (PHP)', key: 'cost_price', width: 18 },
                    { header: 'Qty Purchased', key: 'qty_purchased', width: 15 },
                    { header: 'Total Cost (PHP)', key: 'total_cost', width: 20 },
                    { header: 'Supplier', key: 'supplier', width: 25 }
                ];

                worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
                worksheet.addRows(data);

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=MaxC_Purchase_Ledger.xlsx');

                await workbook.xlsx.write(res);
                res.end();
            } catch (error) {
                console.error("Purchase Excel Error:", error);
                if (!res.headersSent) res.status(500).json({ error: "Failed to generate Excel file" });
            }
        });
    }
};

module.exports = exportController;