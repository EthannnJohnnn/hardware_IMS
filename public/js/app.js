// public/js/app.js

// ==========================================
// 1. FETCH & RENDER PRODUCTS
// ==========================================
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        document.getElementById('totalProductsText').innerText = products.length + " Items";

        const tableBody = document.getElementById('productTableBody');
        tableBody.innerHTML = ''; 

        for (const product of products) {
            let stockBadge = 'bg-success';
            if (product.current_stock <= 5) stockBadge = 'bg-warning text-dark';
            if (product.current_stock === 0) stockBadge = 'bg-danger';

            const row = `
                <tr>
                    <td class="fw-bold text-muted">${product.item_code}</td>
                    <td class="fw-bold">${product.item_name}</td>
                    <td>₱${product.cost_price.toFixed(2)}</td>
                    <td>₱${product.srp.toFixed(2)}</td>
                    <td><span class="badge ${stockBadge}">${product.current_stock}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary fw-bold" 
                            onclick="openTransactionModal('${product.item_code}', '${product.item_name}', ${product.current_stock})">
                            Transact
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    } catch (error) { console.error("Error loading products:", error); }
}

// ==========================================
// 2. ADD NEW PRODUCT LOGIC
// ==========================================
document.getElementById('saveProductBtn').addEventListener('click', async () => {
    const newProduct = {
        item_code: document.getElementById('itemCodeInput').value,
        item_name: document.getElementById('itemNameInput').value,
        cost_price: parseFloat(document.getElementById('costPriceInput').value),
        srp: parseFloat(document.getElementById('srpInput').value),
        current_stock: 0 
    };

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            document.getElementById('addProductForm').reset();
            loadProducts();
        }
    } catch (error) { console.error("Error saving product:", error); }
});

// ==========================================
// 3. TRANSACTION LOGIC & VALIDATION
// ==========================================
let currentTransactionModal; 

function openTransactionModal(itemCode, itemName, currentStock) {
    document.getElementById('transactionItemCode').value = itemCode;
    document.getElementById('transactionItemName').innerText = `Item: ${itemName} (In Stock: ${currentStock})`;
    document.getElementById('transactionQuantity').value = 1;
    document.getElementById('transactionQuantity').dataset.stockLimit = currentStock;

    currentTransactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    currentTransactionModal.show();
}

document.getElementById('transactionType').addEventListener('change', function() {
    const purchaseFields = document.getElementById('purchaseFields');
    if (this.value === 'purchase') {
        purchaseFields.classList.remove('d-none'); 
    } else {
        purchaseFields.classList.add('d-none');    
    }
});

document.getElementById('saveTransactionBtn').addEventListener('click', async () => {
    const itemCode = document.getElementById('transactionItemCode').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);

    if (isNaN(quantity) || quantity <= 0) {
        return alert("Please enter a valid number greater than 0.");
    }
    if (type === 'sale') {
        const stockLimit = parseInt(document.getElementById('transactionQuantity').dataset.stockLimit);
        if (quantity > stockLimit) {
            return alert(`🛑 Error: You cannot sell ${quantity} items. You only have ${stockLimit} in stock!`);
        }
    }

    const transactionData = { item_code: itemCode, quantity: quantity };

    if (type === 'purchase') {
        transactionData.supplier = document.getElementById('transactionSupplier').value;
        transactionData.cost_price = parseFloat(document.getElementById('transactionCostPrice').value);
        if (!transactionData.supplier || !transactionData.cost_price) return alert("Please enter Supplier and Cost Price.");
    }

    const apiUrl = type === 'sale' ? '/api/transactions/sale' : '/api/transactions/purchase';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            currentTransactionModal.hide(); 
            document.getElementById('transactionSupplier').value = '';
            document.getElementById('transactionCostPrice').value = '';
            document.getElementById('transactionType').value = 'sale'; 
            document.getElementById('purchaseFields').classList.add('d-none');
            
            loadProducts();         
            loadDashboardSummary();
            loadDashboardCharts(); 
        } else { alert("Transaction failed. Check server console."); }
    } catch (error) { console.error("Error processing transaction:", error); }
});

// ==========================================
// 4. SIDEBAR NAVIGATION LOGIC (SPA)
// ==========================================
function switchView(viewId, linkId, titleText) {
    document.getElementById('view-dashboard').classList.add('d-none');
    document.getElementById('view-inventory').classList.add('d-none');
    document.getElementById('view-sales-ledger').classList.add('d-none'); 
    document.getElementById('view-purchase-ledger').classList.add('d-none'); 
    document.getElementById('view-master-reports').classList.add('d-none'); 
    document.getElementById('view-expenses').classList.add('d-none');
    document.getElementById('view-ar').classList.add('d-none'); 
    
    document.getElementById(viewId).classList.remove('d-none');
    
    const allLinks = document.querySelectorAll('#sidebar .nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
        link.classList.add('text-dark');
    });
    
    const activeLink = document.getElementById(linkId);
    if(activeLink) {
        activeLink.classList.remove('text-dark');
        activeLink.classList.add('active');
    }
    
    document.getElementById('pageTitle').innerText = titleText;
}

document.getElementById('nav-dashboard').addEventListener('click', () => {
    switchView('view-dashboard', 'nav-dashboard', 'Dashboard Overview');
    loadDashboardSummary(); 
    loadDashboardCharts();
});
document.getElementById('nav-inventory').addEventListener('click', () => {
    switchView('view-inventory', 'nav-inventory', 'Inventory Management');
});
document.getElementById('nav-sales-ledger').addEventListener('click', () => {
    switchView('view-sales-ledger', 'nav-sales-ledger', 'Sales Ledger');
    if (typeof loadSalesLedger === "function") loadSalesLedger(); 
});
document.getElementById('nav-purchase-ledger').addEventListener('click', () => {
    switchView('view-purchase-ledger', 'nav-purchase-ledger', 'Purchase Ledger');
    if (typeof loadPurchaseLedger === "function") loadPurchaseLedger(); 
});
document.getElementById('nav-master-reports').addEventListener('click', () => {
    switchView('view-master-reports', 'nav-master-reports', 'Master Financial Reports');
    if (typeof loadPurchaseAggregation === "function") loadPurchaseAggregation('daily');
    
    // Auto-Set the dates to the current month when opened
    if (!document.getElementById('reportStartDate').value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
    }
    // Auto-generate the report
    if (typeof generateExecutiveReport === "function") generateExecutiveReport(); 
});
document.getElementById('nav-expenses').addEventListener('click', () => {
    switchView('view-expenses', 'nav-expenses', 'Operating Expenses');
    if (typeof loadExpenses === "function") loadExpenses();
});
document.getElementById('nav-ar').addEventListener('click', () => {
    switchView('view-ar', 'nav-ar', 'Accounts Receivable');
    if (typeof loadAR === "function") loadAR(); 
});

// ==========================================
// 5. FINANCIAL MATH & CHART.JS
// ==========================================
async function loadDashboardSummary() {
    try {
        const response = await fetch('/api/reports/summary');
        const data = await response.json();
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
        document.getElementById('totalSalesText').innerText = currencyFormatter.format(data.total_sales || 0);
        document.getElementById('netProfitText').innerText = currencyFormatter.format(data.net_amount || 0);
    } catch (error) { console.error("Error loading financial summary:", error); }
}

let salesChart = null;
let purchaseChart = null;
let expenseChart = null;

async function loadDashboardCharts(days = 7) {
    try {
        const reportRes = await fetch('/api/reports/daily');
        const dailyData = await reportRes.json();
        
        const expenseRes = await fetch('/api/expenses');
        const expenseData = await expenseRes.json();

        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        const filteredData = dailyData.slice(0, days).reverse(); 
        const labels = filteredData.map(day => day.report_date);
        const revenues = filteredData.map(day => day.total_revenue);
        const cogs = filteredData.map(day => day.total_cogs);

        const totalCogsValue = cogs.reduce((sum, val) => sum + val, 0);
        document.getElementById('totalCogsText').innerText = currencyFormatter.format(totalCogsValue);

        const expenseTotals = {};
        expenseData.forEach(exp => {
            if (!expenseTotals[exp.description]) expenseTotals[exp.description] = 0;
            expenseTotals[exp.description] += exp.amount;
        });
        const expLabels = Object.keys(expenseTotals);
        const expAmounts = Object.values(expenseTotals);

        const totalExpenseValue = expAmounts.reduce((sum, val) => sum + val, 0);
        const formattedExpenseTotal = currencyFormatter.format(totalExpenseValue);

        if (salesChart) salesChart.destroy();
        if (purchaseChart) purchaseChart.destroy();
        if (expenseChart) expenseChart.destroy();

        const ctxSales = document.getElementById('salesChart').getContext('2d');
        salesChart = new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: '#4f46e5',
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => currencyFormatter.format(context.raw) } }
                },
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });

        const ctxPurchases = document.getElementById('purchaseChart').getContext('2d');
        const gradient = ctxPurchases.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)'); 
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)'); 

        purchaseChart = new Chart(ctxPurchases, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cost of Goods',
                    data: cogs,
                    borderColor: '#8b5cf6', 
                    backgroundColor: gradient, 
                    fill: true,
                    tension: 0.4, 
                    pointRadius: 3, 
                    pointBackgroundColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => currencyFormatter.format(context.raw) } }
                },
                scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
                interaction: { mode: 'index', intersect: false } 
            }
        });

        const ctxExpense = document.getElementById('expenseChart').getContext('2d');
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: function(chart) {
                const { ctx, chartArea: { left, top, width, height } } = chart;
                ctx.save();
                const centerX = left + width / 2;
                const centerY = top + height / 2;
                ctx.font = 'bold 15px Inter, sans-serif';
                ctx.fillStyle = '#334155';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(formattedExpenseTotal, centerX, centerY - 6);
                ctx.font = '11px Inter, sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText('Total', centerX, centerY + 12);
                ctx.restore();
            }
        };

        expenseChart = new Chart(ctxExpense, {
            type: 'doughnut',
            data: {
                labels: expLabels.length > 0 ? expLabels : ['No Expenses'],
                datasets: [{
                    data: expAmounts.length > 0 ? expAmounts : [1],
                    backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            plugins: [centerTextPlugin],
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '80%', 
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
                    tooltip: { callbacks: { label: (context) => ` ${context.label}: ${currencyFormatter.format(context.raw)}` } }
                }
            }
        });

    } catch (error) { console.error("Error loading charts:", error); }
}

document.getElementById('chartTimeframe').addEventListener('change', (event) => {
    loadDashboardCharts(parseInt(event.target.value));
});

// ==========================================
// 6. OTHER DATA LOADERS (LEDGERS & REPORTS)
// ==========================================
async function loadSalesLedger() {
    try {
        const response = await fetch('/api/ledger/sales');
        const sales = await response.json();
        const tableBody = document.getElementById('salesLedgerTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        sales.forEach(sale => {
            const row = `
                <tr>
                    <td class="text-muted small">${sale.date}</td>
                    <td class="text-muted fw-bold">${sale.item_code}</td>
                    <td class="text-start fw-bold text-dark">${sale.item_name}</td>
                    <td class="text-muted">${currencyFormatter.format(sale.unit_price)}</td>
                    <td class="fw-bold text-primary">${sale.qty_sold}</td>
                    <td class="fw-bold text-success">${currencyFormatter.format(sale.total_sales)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) { console.error("Error loading sales ledger:", error); }
}

async function loadPurchaseLedger() {
    try {
        const response = await fetch('/api/ledger/purchases');
        const purchases = await response.json();
        const tableBody = document.getElementById('purchaseLedgerTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        purchases.forEach(purchase => {
            const row = `
                <tr>
                    <td class="text-muted small">${purchase.date}</td>
                    <td class="text-muted fw-bold">${purchase.item_code}</td>
                    <td class="text-start fw-bold text-dark">${purchase.item_name}</td>
                    <td class="text-muted">${currencyFormatter.format(purchase.cost_price)}</td>
                    <td class="fw-bold text-primary">${purchase.qty_purchased}</td>
                    <td class="fw-bold text-danger">${currencyFormatter.format(purchase.total_cost)}</td>
                    <td><span class="badge bg-light text-dark border">${purchase.supplier || 'N/A'}</span></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) { console.error("Error loading purchase ledger:", error); }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        const tableBody = document.getElementById('expenseTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        for (const exp of expenses) {
            const row = `
                <tr>
                    <td class="text-muted fw-bold">${exp.expense_date}</td>
                    <td class="fw-bold">${exp.description}</td>
                    <td class="text-danger fw-bold">-${currencyFormatter.format(exp.amount)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    } catch (error) { console.error("Error loading expenses:", error); }
}

document.getElementById('saveExpenseBtn').addEventListener('click', async () => {
    const expenseData = {
        description: document.getElementById('expenseDescInput').value,
        amount: parseFloat(document.getElementById('expenseAmountInput').value)
    };
    if (!expenseData.description || !expenseData.amount) return alert("Please enter a description and amount.");

    try {
        const response = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expenseData) });
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
            document.getElementById('expenseDescInput').value = '';
            document.getElementById('expenseAmountInput').value = '';
            loadExpenses();
            loadDashboardSummary();
            loadDashboardCharts(); 
        }
    } catch (error) { console.error("Error saving expense:", error); }
});

async function loadAR() {
    try {
        const response = await fetch('/api/ar');
        const debts = await response.json();
        const tableBody = document.getElementById('arTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        for (const debt of debts) {
            const isPaid = debt.status.toLowerCase() === 'paid';
            const statusBadge = isPaid 
                ? `<span class="badge bg-success shadow-sm">Paid</span>` 
                : `<span class="badge bg-warning text-dark shadow-sm">Unpaid</span>`;
            
            const actionButton = isPaid 
                ? `<span class="text-success small fw-bold"><i class="bi bi-check-circle-fill"></i> Settled</span>`
                : `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="markDebtPaid(${debt.id})">✓ Mark as Paid</button>`;

            const amountClass = isPaid ? "text-muted text-decoration-line-through" : "text-warning fw-bold";

            const row = `
                <tr>
                    <td class="text-muted fw-bold">${debt.date_issued || debt.date}</td>
                    <td class="fw-bold text-primary">${debt.customer_name}</td>
                    <td class="text-muted">${debt.description}</td>
                    <td class="${amountClass}">${currencyFormatter.format(debt.amount)}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    } catch (error) { console.error("Error loading AR:", error); }
}

document.getElementById('saveArBtn').addEventListener('click', async () => {
    const debtData = {
        customer_name: document.getElementById('arNameInput').value,
        description: document.getElementById('arDescInput').value,
        amount: parseFloat(document.getElementById('arAmountInput').value)
    };
    if (!debtData.customer_name || !debtData.amount) return alert("Name and amount are required.");

    try {
        const response = await fetch('/api/ar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debtData) });
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('arModal')).hide();
            document.getElementById('arNameInput').value = '';
            document.getElementById('arDescInput').value = '';
            document.getElementById('arAmountInput').value = '';
            loadAR();
        }
    } catch (error) { console.error("Error saving debt:", error); }
});

async function markDebtPaid(id) {
    if(!confirm("Are you sure this customer has fully paid this amount?")) return;
    try {
        const response = await fetch(`/api/ar/${id}/pay`, { method: 'PUT' });
        if (response.ok) loadAR(); 
    } catch (error) { console.error("Error marking debt as paid:", error); }
}

// ==========================================
// 7. REAL-TIME SEARCH LOGIC
// ==========================================
document.getElementById('searchInput').addEventListener('input', function(event) {
    const searchTerm = event.target.value.toLowerCase();
    const tableRows = document.querySelectorAll('#productTableBody tr');
    const inventoryTabIsHidden = document.getElementById('view-inventory').classList.contains('d-none');
    
    if (searchTerm.length > 0 && inventoryTabIsHidden) {
        document.getElementById('nav-inventory').click(); 
    }

    tableRows.forEach(row => {
        const itemCode = row.cells[0].textContent.toLowerCase();
        const itemName = row.cells[1].textContent.toLowerCase();

        if (itemCode.includes(searchTerm) || itemName.includes(searchTerm)) {
            row.style.display = ''; 
        } else {
            row.style.display = 'none'; 
        }
    });
});

// ==========================================
// 8. REPORT AGGREGATION (PHASE 8)
// ==========================================
async function loadPurchaseAggregation(type = 'daily') {
    try {
        // Fetch the data and attach the type (daily or monthly)
        const response = await fetch(`/api/reports/purchases?type=${type}`);
        const data = await response.json();
        const tableBody = document.getElementById('purchaseAggTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        data.forEach(row => {
            let displayDate = row.date;
            
            // Format "2026-06" into "June 2026" for the monthly view to make it look professional
            if (type === 'monthly') {
                const [year, month] = row.date.split('-');
                const dateObj = new Date(year, month - 1);
                displayDate = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            }

            const tr = `
                <tr>
                    <td class="fw-bold text-muted">${displayDate}</td>
                    <td class="fw-bold text-danger">-${currencyFormatter.format(row.total_cost)}</td>
                </tr>
            `;
            tableBody.innerHTML += tr;
        });
        
        // Ensure the dropdown correctly displays what is currently being shown
        document.getElementById('purchaseAggToggle').value = type;
    } catch (error) { console.error("Error loading purchase aggregation:", error); }
}

// Listen for when the user changes the dropdown from Daily to Monthly
const purchaseAggToggle = document.getElementById('purchaseAggToggle');
if (purchaseAggToggle) {
    purchaseAggToggle.addEventListener('change', (event) => {
        loadPurchaseAggregation(event.target.value);
    });
}

// ==========================================
// 9. EXECUTIVE MASTER REPORT (EXCEL REPLICA)
// ==========================================
async function generateExecutiveReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) return alert("Please select both a start and end date.");

    try {
        // Ask the backend to crunch the math for this specific timeframe!
        const response = await fetch(`/api/reports/summary?start=${startDate}&end=${endDate}`);
        const data = await response.json();
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        // Populate the Text Dates
        document.getElementById('execStartDate').innerText = startDate;
        document.getElementById('execEndDate').innerText = endDate;

        // Populate the Money 
        document.getElementById('execTotalSales').innerText = currencyFormatter.format(data.total_sales || 0);
        document.getElementById('execTotalPurchases').innerText = currencyFormatter.format(data.total_purchases || 0);
        document.getElementById('execTotalExpenses').innerText = currencyFormatter.format(data.total_expenses || 0);
        
        // Dynamically color the Net Amount (Green if positive, Red if they are losing money)
        const netAmountEl = document.getElementById('execNetAmount');
        netAmountEl.innerText = currencyFormatter.format(data.net_amount || 0);
        netAmountEl.className = data.net_amount >= 0 ? 'fw-bold fs-5 text-success border-start-0' : 'fw-bold fs-5 text-danger border-start-0';

        // Populate Current Inventory Value
        document.getElementById('execInventoryValue').innerText = currencyFormatter.format(data.current_inventory_value || 0);

    } catch (error) { console.error("Error generating executive report:", error); }
}

// Bind the Generate button
const generateReportBtn = document.getElementById('generateReportBtn');
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', generateExecutiveReport);
}

// ==========================================
// 10. ADMIN WORKSPACE & TASK LOGIC
// ==========================================

// 1. Toolbar Functions
function formatNote(command) {
    document.execCommand(command, false, null);
    document.getElementById('globalStickyNote').focus();
}

function insertCheckbox() {
    // Injects a clickable HTML checkbox directly into the text!
    const checkboxHTML = '&nbsp;<input type="checkbox"> &nbsp;';
    document.execCommand('insertHTML', false, checkboxHTML);
    document.getElementById('globalStickyNote').focus();
}

// 2. Load the Workspace from the Database
async function loadStickyNote() {
    try {
        const response = await fetch('/api/note');
        const data = await response.json();
        if (data && data.content) {
            // Use innerHTML so the checkboxes and bold tags render correctly
            document.getElementById('globalStickyNote').innerHTML = data.content;
        }
    } catch (error) { console.error("Error loading workspace:", error); }
}

// 3. Save the Workspace to the Database
const saveNoteBtn = document.getElementById('saveNoteBtn');
if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', async () => {
        // Grab all the formatted HTML inside the editor
        const content = document.getElementById('globalStickyNote').innerHTML;
        
        try {
            const response = await fetch('/api/note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content })
            });
            
            if (response.ok) {
                const originalText = saveNoteBtn.innerHTML;
                saveNoteBtn.innerHTML = "Saved! <i class='bi bi-check-lg'></i>";
                saveNoteBtn.classList.replace('btn-warning', 'btn-success');
                
                setTimeout(() => { 
                    saveNoteBtn.innerHTML = originalText; 
                    saveNoteBtn.classList.replace('btn-success', 'btn-warning');
                }, 2000);
            }
        } catch (error) { console.error("Error saving workspace:", error); }
    });
}

// Initialize the workspace when the app loads
loadStickyNote();
// Initialize on page load
loadProducts();
loadDashboardSummary();
loadDashboardCharts();