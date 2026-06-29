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
    // Show current stock in the modal header
    document.getElementById('transactionItemName').innerText = `Item: ${itemName} (In Stock: ${currentStock})`;
    document.getElementById('transactionQuantity').value = 1;
    
    // Store the limit invisibly for validation
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

    // --- SAFETY VALIDATION ---
    if (isNaN(quantity) || quantity <= 0) {
        return alert("Please enter a valid number greater than 0.");
    }
    if (type === 'sale') {
        const stockLimit = parseInt(document.getElementById('transactionQuantity').dataset.stockLimit);
        if (quantity > stockLimit) {
            return alert(`🛑 Error: You cannot sell ${quantity} items. You only have ${stockLimit} in stock!`);
        }
    }
    // -------------------------

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
            loadDashboardChart(); // Refresh chart when money moves!
        } else { alert("Transaction failed. Check server console."); }
    } catch (error) { console.error("Error processing transaction:", error); }
});

// ==========================================
// 4. SIDEBAR NAVIGATION LOGIC (SPA)
// ==========================================
function switchView(viewId, linkId, titleText) {
    document.getElementById('view-dashboard').classList.add('d-none');
    document.getElementById('view-inventory').classList.add('d-none');
    document.getElementById('view-sales').classList.add('d-none'); 
    document.getElementById('view-expenses').classList.add('d-none');
    document.getElementById('view-ar').classList.add('d-none'); 
    
    document.getElementById(viewId).classList.remove('d-none');
    
    document.getElementById('nav-dashboard').className = 'nav-link text-dark';
    document.getElementById('nav-inventory').className = 'nav-link text-dark';
    document.getElementById('nav-sales').className = 'nav-link text-dark';    
    document.getElementById('nav-expenses').className = 'nav-link text-dark'; 
    document.getElementById('nav-ar').className = 'nav-link text-dark'; 
    
    document.getElementById(linkId).className = 'nav-link active';
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
document.getElementById('nav-sales').addEventListener('click', () => {
    switchView('view-sales', 'nav-sales', 'Sales & Purchases History');
    loadDailyReports(); 
});
document.getElementById('nav-expenses').addEventListener('click', () => {
    switchView('view-expenses', 'nav-expenses', 'Operating Expenses');
    loadExpenses();
});
document.getElementById('nav-ar').addEventListener('click', () => {
    switchView('view-ar', 'nav-ar', 'Accounts Receivable');
    loadAR(); 
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

// Global variables to hold our 3 charts
let salesChart = null;
let purchaseChart = null;
let expenseChart = null;

async function loadDashboardCharts(days = 7) {
    try {
        const reportRes = await fetch('/api/reports/daily');
        const dailyData = await reportRes.json();
        
        const expenseRes = await fetch('/api/expenses');
        const expenseData = await expenseRes.json();

        // Data Formatters
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        const filteredData = dailyData.slice(0, days).reverse(); 
        const labels = filteredData.map(day => day.report_date);
        const revenues = filteredData.map(day => day.total_revenue);
        const cogs = filteredData.map(day => day.total_cogs);

        // 1. Calculate & Display Total COGS
        const totalCogsValue = cogs.reduce((sum, val) => sum + val, 0);
        document.getElementById('totalCogsText').innerText = currencyFormatter.format(totalCogsValue);

        const expenseTotals = {};
        expenseData.forEach(exp => {
            if (!expenseTotals[exp.description]) expenseTotals[exp.description] = 0;
            expenseTotals[exp.description] += exp.amount;
        });
        const expLabels = Object.keys(expenseTotals);
        const expAmounts = Object.values(expenseTotals);

        // 2. Calculate Total Expenses (For the new plugin)
        const totalExpenseValue = expAmounts.reduce((sum, val) => sum + val, 0);
        const formattedExpenseTotal = currencyFormatter.format(totalExpenseValue);

        if (salesChart) salesChart.destroy();
        if (purchaseChart) purchaseChart.destroy();
        if (expenseChart) expenseChart.destroy();

        // --- CHART 1: MAIN SALES ---
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

        // --- CHART 2: PURCHASES / COGS ---
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

        // --- CHART 3: EXPENSES (FIXED WITH CUSTOM PLUGIN) ---
        const ctxExpense = document.getElementById('expenseChart').getContext('2d');
        
        // ✨ THE FIX: This paints the text mathematically centered inside the doughnut
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: function(chart) {
                const { ctx, chartArea: { left, top, width, height } } = chart;
                ctx.save();
                
                // Find the exact center of the drawn chart area
                const centerX = left + width / 2;
                const centerY = top + height / 2;
                
                // Draw the Amount
                ctx.font = 'bold 15px Inter, sans-serif';
                ctx.fillStyle = '#334155';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(formattedExpenseTotal, centerX, centerY - 6);
                
                // Draw the 'Total' label
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
            plugins: [centerTextPlugin], // Inject the plugin right here
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

// Dropdown Listener
document.getElementById('chartTimeframe').addEventListener('change', (event) => {
    loadDashboardCharts(parseInt(event.target.value));
});

// ==========================================
// 6. OTHER DATA LOADERS
// ==========================================
async function loadDailyReports() {
    try {
        const response = await fetch('/api/reports/daily');
        const dailyData = await response.json();
        const tableBody = document.getElementById('dailyReportTableBody');
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        for (const day of dailyData) {
            let profitColor = day.gross_profit >= 0 ? 'text-success' : 'text-danger';
            const row = `
                <tr>
                    <td class="fw-bold">${day.report_date}</td>
                    <td>${day.items_sold}</td>
                    <td class="text-muted">${currencyFormatter.format(day.total_revenue)}</td>
                    <td class="text-muted">${currencyFormatter.format(day.total_cogs)}</td>
                    <td class="fw-bold ${profitColor}">${currencyFormatter.format(day.gross_profit)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    } catch (error) { console.error("Error loading daily reports:", error); }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        const tableBody = document.getElementById('expenseTableBody');
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
            loadDashboardChart(); // Redraw chart to reflect the expense!
        }
    } catch (error) { console.error("Error saving expense:", error); }
});

async function loadAR() {
    try {
        const response = await fetch('/api/ar');
        const debts = await response.json();
        const tableBody = document.getElementById('arTableBody');
        tableBody.innerHTML = ''; 
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        for (const debt of debts) {
            // 1. Check if the backend marked this as paid
            // THE FIX: Converts whatever the database sends into lowercase just to be safe!
            const isPaid = debt.status.toLowerCase() === 'paid';

            // 2. Create dynamic UI elements based on the status
            const statusBadge = isPaid 
                ? `<span class="badge bg-success shadow-sm">Paid</span>` 
                : `<span class="badge bg-warning text-dark shadow-sm">Unpaid</span>`;
            
            // If paid, show a checkmark. If unpaid, show the action button.
            const actionButton = isPaid 
                ? `<span class="text-success small fw-bold"><i class="bi bi-check-circle-fill"></i> Settled</span>`
                : `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="markDebtPaid(${debt.id})">✓ Mark as Paid</button>`;

            // Strike through the text if it's already paid
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
    // 1. Get whatever the user typed and convert it to lowercase
    const searchTerm = event.target.value.toLowerCase();
    
    // 2. Grab all the rows inside the Inventory table
    const tableRows = document.querySelectorAll('#productTableBody tr');

    // 3. Pro-Move: Automatically switch to the Inventory tab if they start typing!
    const inventoryTabIsHidden = document.getElementById('view-inventory').classList.contains('d-none');
    if (searchTerm.length > 0 && inventoryTabIsHidden) {
        document.getElementById('nav-inventory').click(); 
    }

    // 4. Loop through every row and check if it matches
    tableRows.forEach(row => {
        // We want to search by Item Code (column 0) or Item Name (column 1)
        const itemCode = row.cells[0].textContent.toLowerCase();
        const itemName = row.cells[1].textContent.toLowerCase();

        // If the search term is inside the code OR the name, show the row. Otherwise, hide it.
        if (itemCode.includes(searchTerm) || itemName.includes(searchTerm)) {
            row.style.display = ''; 
        } else {
            row.style.display = 'none'; 
        }
    });
});

// Initialize on page load
loadProducts();
loadDashboardSummary();
loadDashboardCharts();