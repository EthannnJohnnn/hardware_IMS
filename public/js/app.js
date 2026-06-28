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
        // 1. Fetch Data
        const reportRes = await fetch('/api/reports/daily');
        const dailyData = await reportRes.json();
        
        const expenseRes = await fetch('/api/expenses');
        const expenseData = await expenseRes.json();

        // 2. Process Daily Sales & Costs
        const filteredData = dailyData.slice(0, days).reverse(); 
        const labels = filteredData.map(day => day.report_date);
        const revenues = filteredData.map(day => day.total_revenue);
        const cogs = filteredData.map(day => day.total_cogs);

        // 3. Process Expenses for the Pie Chart (Group by Description)
        const expenseTotals = {};
        expenseData.forEach(exp => {
            // Group identical expenses together (e.g., all "Payroll" gets added together)
            if (!expenseTotals[exp.description]) expenseTotals[exp.description] = 0;
            expenseTotals[exp.description] += exp.amount;
        });
        const expLabels = Object.keys(expenseTotals);
        const expAmounts = Object.values(expenseTotals);

        // --- DESTROY OLD CHARTS TO PREVENT BUGS ---
        if (salesChart) salesChart.destroy();
        if (purchaseChart) purchaseChart.destroy();
        if (expenseChart) expenseChart.destroy();

        // --- CHART 1: MAIN SALES (BAR CHART) ---
        const ctxSales = document.getElementById('salesChart').getContext('2d');
        salesChart = new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Revenue (₱)',
                    data: revenues,
                    backgroundColor: '#4f46e5', // Deep Indigo
                    borderRadius: 4, // Rounded bars
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Fixes layout bugs
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });

        // --- CHART 2: PURCHASES / COGS (AREA CHART) ---
        const ctxPurchases = document.getElementById('purchaseChart').getContext('2d');
        purchaseChart = new Chart(ctxPurchases, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Item Costs (₱)',
                    data: cogs,
                    borderColor: '#8b5cf6', // Violet
                    backgroundColor: 'rgba(139, 92, 246, 0.2)', // Faded Violet Fill
                    fill: true,
                    tension: 0.4, // Smooth curvy line
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { display: false }, // Hides the bottom text for a clean look
                    y: { display: false, beginAtZero: true } 
                }
            }
        });

        // --- CHART 3: EXPENSES (DOUGHNUT CHART) ---
        const ctxExpense = document.getElementById('expenseChart').getContext('2d');
        expenseChart = new Chart(ctxExpense, {
            type: 'doughnut',
            data: {
                labels: expLabels.length > 0 ? expLabels : ['No Expenses'],
                datasets: [{
                    data: expAmounts.length > 0 ? expAmounts : [1],
                    backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', // Makes the ring thin and modern
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } }
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
            const row = `
                <tr>
                    <td class="text-muted fw-bold">${debt.date_issued}</td>
                    <td class="fw-bold text-primary">${debt.customer_name}</td>
                    <td class="text-muted">${debt.description}</td>
                    <td class="text-warning fw-bold">${currencyFormatter.format(debt.amount)}</td>
                    <td>
                        <button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="markDebtPaid(${debt.id})">
                            ✓ Mark as Paid
                        </button>
                    </td>
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

// Initialize on page load
loadProducts();
loadDashboardSummary();
loadDashboardCharts();