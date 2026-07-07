// public/js/app.js

// ==========================================
// 1. FETCH & RENDER PRODUCTS
// ==========================================
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        allProductsData = products; // Keep this in sync for the live transaction calculator

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
    document.getElementById('transactionDiscount').value = 0;
    document.getElementById('liveTotalDisplay').classList.add('d-none');

    currentTransactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    currentTransactionModal.show();
}

// ==========================================
// PHASE 15: LIVE MATH CALCULATOR FOR MODAL
// ==========================================
function calculateLiveTotal() {
    const type = document.getElementById('transactionType').value;
    const qty = parseInt(document.getElementById('transactionQuantity').value) || 0;
    const discount = parseFloat(document.getElementById('transactionDiscount').value) || 0;

    // We only calculate live totals for sales
    if (type === 'sale') {
        const itemCode = document.getElementById('transactionItemCode').value;
        const selectedItem = allProductsData.find(p => p.item_code === itemCode);

        if (selectedItem) {
            let total = (selectedItem.srp * qty) - discount;
            if (total < 0) total = 0; // Prevent negative totals!

            document.getElementById('liveTotalDisplay').classList.remove('d-none');
            const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
            document.getElementById('liveTotalAmount').innerText = currencyFormatter.format(total);
        }
    } else {
        document.getElementById('liveTotalDisplay').classList.add('d-none');
    }
}

document.getElementById('transactionQuantity').addEventListener('input', calculateLiveTotal);
document.getElementById('transactionDiscount').addEventListener('input', calculateLiveTotal);

document.getElementById('transactionType').addEventListener('change', function() {
    const purchaseFields = document.getElementById('purchaseFields');
    const discountField = document.getElementById('discountField');

    if (this.value === 'purchase') {
        purchaseFields.classList.remove('d-none');
        discountField.classList.add('d-none');
    } else if (this.value === 'sale') {
        purchaseFields.classList.add('d-none');
        discountField.classList.remove('d-none');
    } else {
        purchaseFields.classList.add('d-none');
        discountField.classList.add('d-none');
    }

    calculateLiveTotal();
});

document.getElementById('saveTransactionBtn').addEventListener('click', async () => {
    const itemCode = document.getElementById('transactionItemCode').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);

    if (isNaN(quantity) || quantity <= 0) {
        return alert("Please enter a valid number greater than 0.");
    }
    
    // Prevent deducting more stock than you have for Sales AND Transfers Out
    if (type === 'sale' || type === 'transfer_out') {
        const stockLimit = parseInt(document.getElementById('transactionQuantity').dataset.stockLimit);
        if (quantity > stockLimit) {
            return alert(`🛑 Error: You only have ${stockLimit} in stock!`);
        }
    }

    let apiUrl = '';
    let method = 'POST';
    let payload = {};

    // Standard Financial Transactions
    if (type === 'sale' || type === 'purchase') {
        apiUrl = type === 'sale' ? '/api/transactions/sale' : '/api/transactions/purchase';
        payload = { item_code: itemCode, quantity: quantity };

        if (type === 'sale') {
            payload.discount = parseFloat(document.getElementById('transactionDiscount').value) || 0;
        }

        if (type === 'purchase') {
            payload.supplier = document.getElementById('transactionSupplier').value;
            payload.cost_price = parseFloat(document.getElementById('transactionCostPrice').value);
            if (!payload.supplier || !payload.cost_price) return alert("Please enter Supplier and Cost Price.");
        }
    } 
    // ✨ NEW: Stock Adjustments (Branch Transfers) ✨
    else {
        apiUrl = '/api/products/adjust';
        method = 'PUT'; 
        payload = { item_code: itemCode, action: type, qty: quantity };
    }

    try {
        const response = await fetch(apiUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            currentTransactionModal.hide(); 
            document.getElementById('transactionSupplier').value = '';
            document.getElementById('transactionCostPrice').value = '';
            document.getElementById('transactionDiscount').value = 0;
            document.getElementById('liveTotalDisplay').classList.add('d-none');
            document.getElementById('transactionType').value = 'sale'; 
            document.getElementById('purchaseFields').classList.add('d-none');
            document.getElementById('discountField').classList.remove('d-none');
            
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
                    <td class="fw-bold text-danger">-${currencyFormatter.format(sale.discount)}</td> <td class="fw-bold text-success">${currencyFormatter.format(sale.total_sales)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="attemptEdit(${sale.id}, 'sale', ${sale.qty_sold})">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    </td>
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
                    <td class="text-muted fw-bold">${purchase.supplier}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="attemptEdit(${purchase.id}, 'purchase', ${purchase.qty_purchased}, ${purchase.cost_price}, '${purchase.supplier}')">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    </td>
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

// ==========================================
// PHASE 16: ACCOUNTS RECEIVABLE RENDERING
// ==========================================
async function loadAR() {
    try {
        const response = await fetch('/api/ar'); // Ensure this matches your route
        const arData = await response.json();
        const tableBody = document.getElementById('arTableBody');
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
        
        tableBody.innerHTML = '';

        arData.forEach(ar => {
            let rowClass = "";
            let textClass = "text-muted";
            let penaltyClass = "text-muted";
            
            // Apply Visual Color Warnings
            if (ar.status === 'Unpaid' && ar.days_overdue > 7) {
                rowClass = "table-warning text-dark border-warning"; // Entire row turns orange
                textClass = "text-danger fw-bold";
                if (ar.penalty > 0) penaltyClass = "text-danger fw-bold";
            } else if (ar.status === 'Paid') {
                rowClass = "table-light text-muted opacity-75"; // Fade out paid debts
            }

            const row = `
                <tr class="${rowClass}">
                    <td class="small">${ar.date.split(' ')[0]}</td>
                    <td class="fw-bold text-dark">${ar.customer_name}</td>
                    <td class="small fw-bold">${ar.item_name}</td>
                    <td class="fw-bold text-primary">${ar.quantity}</td>
                    <td class="text-dark">${currencyFormatter.format(ar.base_debt)}</td>
                    <td class="${textClass}">${ar.status === 'Paid' ? '--' : ar.days_overdue + ' Days'}</td>
                    <td class="${penaltyClass}">+${currencyFormatter.format(ar.penalty)}</td>
                    <td class="fw-bold text-danger fs-6">${currencyFormatter.format(ar.total_due)}</td>
                    <td>
                        <span class="badge ${ar.status === 'Paid' ? 'bg-success' : 'bg-danger shadow-sm'}">${ar.status}</span>
                    </td>
                    <td>
                        ${ar.status === 'Unpaid' 
                            ? `<button class="btn btn-sm btn-success shadow-sm fw-bold px-3" onclick="settleCustomerDebt(${ar.id}, ${ar.total_due})"><i class="bi bi-cash me-1"></i>Settle</button>` 
                            : `<i class="bi bi-check-all text-success fs-5"></i>`}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) { console.error("Error loading AR:", error); }
}

// Settlement Click Action
window.settleCustomerDebt = async function(id, totalDue) {
    const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
    if (!confirm(`Confirm Payment? Collect ${currencyFormatter.format(totalDue)} from the customer.`)) return;

    try {
        const response = await fetch(`/api/ar/${id}/pay`, { method: 'PUT' });
        
        if (response.ok) {
            alert("Debt settled! Revenue and penalties have been added to the Sales Ledger.");
            loadAR();
            if (typeof loadSalesLedger === 'function') loadSalesLedger();
            if (typeof loadDashboardSummary === 'function') loadDashboardSummary();
        } else {
            alert("Failed to settle debt. Check backend routes.");
        }
    } catch (error) { console.error(error); }
};

// Auto-fill the searchable dropdown when the modal opens
async function populateARDropdown() {
    const datalist = document.getElementById('arProductList');
    const input = document.getElementById('arProductInput');
    input.value = ''; 
    datalist.innerHTML = '';
    
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        products.forEach(p => {
            datalist.innerHTML += `<option value="${p.item_code}">${p.item_name} (In Stock: ${p.current_stock} | SRP: ₱${p.srp})</option>`;
        });
    } catch (error) { console.error("Error loading products", error); }
}

const arModalEl = document.getElementById('arModal');
if (arModalEl) {
    arModalEl.addEventListener('show.bs.modal', populateARDropdown);
}

document.getElementById('saveArBtn').addEventListener('click', async () => {
    const customer_name = document.getElementById('arNameInput').value;
    const item_code = document.getElementById('arProductInput').value;
    const qty = parseInt(document.getElementById('arQtyInput').value);
    const alertBox = document.getElementById('arAlert');
    
    alertBox.classList.add('d-none');

    if (!customer_name || !item_code || isNaN(qty) || qty <= 0) {
        alertBox.innerText = "Please fill out all fields and select a valid product.";
        alertBox.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch('/api/ar', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ customer_name, item_code, qty }) 
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save debt.");
        
        bootstrap.Modal.getInstance(document.getElementById('arModal')).hide();
        document.getElementById('arNameInput').value = '';
        document.getElementById('arProductInput').value = '';
        document.getElementById('arQtyInput').value = '';
        
        // Refresh EVERYTHING so stock and AR update instantly
        loadAR();
        loadProducts(); 
    } catch (error) { 
        alertBox.innerText = error.message;
        alertBox.classList.remove('d-none');
    }
});

async function markDebtPaid(id) {
    if(!confirm("Are you sure this customer paid? This will automatically convert the debt into a recorded Sale!")) return;
    try {
        const response = await fetch(`/api/ar/${id}/pay`, { method: 'PUT' });
        if (response.ok) {
            // Update UI to reflect the newly settled debt and newly recorded revenue!
            loadAR(); 
            loadDashboardSummary();
            loadDashboardCharts();
            if (typeof loadSalesLedger === "function") loadSalesLedger();
        }
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

// ==========================================
// 11. EXCEL EXPORT LOGIC
// ==========================================
const exportSalesBtn = document.getElementById('exportSalesBtn');
if (exportSalesBtn) {
    exportSalesBtn.addEventListener('click', () => {
        // Change button text to show it's working
        const originalText = exportSalesBtn.innerHTML;
        exportSalesBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        exportSalesBtn.classList.add('disabled');

        // Trigger the browser's native download behavior
        window.location.href = '/api/export/sales';

        // Reset the button after 2 seconds
        setTimeout(() => {
            exportSalesBtn.innerHTML = originalText;
            exportSalesBtn.classList.remove('disabled');
        }, 2000);
    });
}

// ==========================================
// UNIVERSAL SIDEBAR NAVIGATION CONTROLLER
// ==========================================
document.querySelectorAll('#sidebarNav .nav-link').forEach(link => {
    // Clone and replace to kill old, conflicting UI clickers
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    newLink.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // 1. Clean EVERY link: remove active/blue classes and restore dark text
        document.querySelectorAll('#sidebarNav .nav-link').forEach(l => {
            l.classList.remove('active', 'bg-primary', 'text-white');
            l.classList.add('text-dark');
        });
        
        // 2. Turn ON the clicked link: add active and remove dark text
        this.classList.add('active');
        this.classList.remove('text-dark');
        
        // 3. Update the Top Dashboard Title
        document.getElementById('pageTitle').innerText = this.innerText.trim();

        // 4. Hide every single view container
        document.querySelectorAll('[id^="view-"]').forEach(view => {
            view.classList.add('d-none');
            view.classList.remove('d-block');
        });

        // 5. Show exactly the view that matches the button clicked
        const targetViewId = this.id.replace('nav-', 'view-');
        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.remove('d-none');
            targetView.classList.add('d-block');
        }

        // 6. 🚨 TRIGGER DATA RELOADS: Guarantee tables are never empty! 🚨
        if (this.id === 'nav-dashboard' && typeof loadDashboardSummary === 'function') { loadDashboardSummary(); if(typeof loadDashboardCharts === 'function') loadDashboardCharts(); }
        if (this.id === 'nav-inventory' && typeof loadProducts === 'function') loadProducts();
        if (this.id === 'nav-sales-ledger' && typeof loadSalesLedger === 'function') loadSalesLedger();
        if (this.id === 'nav-purchase-ledger' && typeof loadPurchaseLedger === 'function') loadPurchaseLedger();
        if (this.id === 'nav-expenses' && typeof loadExpenses === 'function') loadExpenses();
        if (this.id === 'nav-ar' && typeof loadAR === 'function') loadAR();

        // 7. If they specifically clicked Item Exchange, load the products list
        if (this.id === 'nav-exchange') {
            try {
                const response = await fetch('/api/products');
                allProductsData = await response.json();
                const datalist = document.getElementById('exchangeProductList');
                datalist.innerHTML = '';
                allProductsData.forEach(p => {
                    // Bonus Fix: Hide the Phantom EXCHANGE item from this dropdown too!
                    if (p.item_code !== 'EXCHANGE') {
                        datalist.innerHTML += `<option value="${p.item_code}">${p.item_name} (SRP: ₱${p.srp})</option>`;
                    }
                });
            } catch (error) { console.error("Error loading products:", error); }
        }
    });
});

// ==========================================
// 13. RETURN & EXCHANGE LOGIC
// ==========================================
let allProductsData = []; 
// Link the Sidebar button to the Exchange View
const navExchangeBtn = document.getElementById('nav-exchange');
if (navExchangeBtn) {
    navExchangeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // --- FIX 1: Change the Top Title ---
        document.getElementById('pageTitle').innerText = 'Item Return & Exchange';

        // --- FIX 2: Swap Sidebar Active Colors ---
        // Turn off all other buttons
        document.querySelectorAll('#sidebarNav .nav-link').forEach(link => {
            link.classList.remove('active', 'bg-primary', 'text-white');
            link.classList.add('text-dark');
        });
        // Turn ON the Item Exchange button
        navExchangeBtn.classList.remove('text-dark');
        navExchangeBtn.classList.add('active', 'text-white', 'bg-primary');

        // 1. Hide every single view safely
        const allViews = ['view-dashboard', 'view-inventory', 'view-sales-ledger', 'view-purchase-ledger', 'view-master-reports', 'view-expenses', 'view-ar', 'view-exchange'];
        allViews.forEach(viewId => {
            const el = document.getElementById(viewId);
            if (el) {
                el.classList.add('d-none');
                el.classList.remove('d-block');
            }
        });

        // 2. Show ONLY the Item Exchange view
        document.getElementById('view-exchange').classList.remove('d-none');
        document.getElementById('view-exchange').classList.add('d-block');

        // 3. Load the latest products into the Exchange Dropdown
        try {
            const response = await fetch('/api/products');
            allProductsData = await response.json();
            
            const datalist = document.getElementById('exchangeProductList');
            datalist.innerHTML = '';
            allProductsData.forEach(p => {
                datalist.innerHTML += `<option value="${p.item_code}">${p.item_name} (SRP: ₱${p.srp})</option>`;
            });
        } catch (error) { console.error("Error loading products for exchange:", error); }
    });
}

// Live Math Calculator
function calculateExchangeMath() {
    const returnCode = document.getElementById('returnItemInput').value;
    const takenCode = document.getElementById('takenItemInput').value;
    const returnQty = parseInt(document.getElementById('returnQtyInput').value) || 0;
    const takenQty = parseInt(document.getElementById('takenQtyInput').value) || 0;

    const returnItem = allProductsData.find(p => p.item_code === returnCode);
    const takenItem = allProductsData.find(p => p.item_code === takenCode);

    const returnTotal = returnItem ? returnItem.srp * returnQty : 0;
    const takenTotal = takenItem ? takenItem.srp * takenQty : 0;
    
    const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

    document.getElementById('returnValueDisplay').innerText = currencyFormatter.format(returnTotal);
    document.getElementById('takenValueDisplay').innerText = currencyFormatter.format(takenTotal);

    const statusMsg = document.getElementById('exchangeStatusMessage');
    const submitBtn = document.getElementById('processExchangeBtn');
    const cashDifference = takenTotal - returnTotal;

    // Strict Validation Rule
    if (!returnItem || !takenItem || returnTotal === 0 || takenTotal === 0) {
        statusMsg.innerText = "Select valid items to calculate difference...";
        statusMsg.className = "fw-bold fs-5 text-muted";
        
        // Disable the button and let Bootstrap make it gray
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-warning');
        submitBtn.classList.add('btn-secondary'); 
    } else if (cashDifference < 0) {
        statusMsg.innerHTML = `<i class="bi bi-x-circle-fill me-2"></i>Invalid: Store does not refund cash. (Difference: ${currencyFormatter.format(cashDifference)})`;
        statusMsg.className = "fw-bold fs-5 text-danger";
        
        // Disable the button and keep it gray
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-warning');
        submitBtn.classList.add('btn-secondary');
    } else {
        statusMsg.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>Valid: Collect Cash Top-up of <span class="text-success fs-4">${currencyFormatter.format(cashDifference)}</span>`;
        statusMsg.className = "fw-bold fs-5 text-dark";
        
        // Enable the button and make it bright warning yellow!
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-secondary');
        submitBtn.classList.add('btn-warning');
        submitBtn.dataset.topUp = cashDifference; 
    }
}

// Add event listeners to trigger the calculator instantly when numbers change
['returnItemInput', 'returnQtyInput', 'takenItemInput', 'takenQtyInput'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateExchangeMath);
});

// Process the Submit
document.getElementById('processExchangeBtn').addEventListener('click', async () => {
    const payload = {
        returned_item_code: document.getElementById('returnItemInput').value,
        returned_qty: parseInt(document.getElementById('returnQtyInput').value),
        taken_item_code: document.getElementById('takenItemInput').value,
        taken_qty: parseInt(document.getElementById('takenQtyInput').value),
        cash_top_up: parseFloat(document.getElementById('processExchangeBtn').dataset.topUp)
    };

    if (!confirm(`Confirm Exchange? You must collect ₱${payload.cash_top_up} from the customer.`)) return;

    try {
        const response = await fetch('/api/exchanges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Exchange Processed Successfully!");
            
            // Clear the form
            document.getElementById('returnItemInput').value = '';
            document.getElementById('takenItemInput').value = '';
            document.getElementById('returnQtyInput').value = '1';
            document.getElementById('takenQtyInput').value = '1';
            calculateExchangeMath();
            
            // Refresh systems
            if (typeof loadProducts === "function") loadProducts();
        } else {
            alert("Failed to process exchange. Check inputs and stock limits.");
        }
    } catch (error) { console.error("Exchange Error:", error); }
});

// ==========================================
// 14. ADMIN LEDGER EDITING & SECURITY
// ==========================================
let pendingEditData = null; // Stores what the user clicked while they enter their PIN

// 1. Expose function to trigger the PIN modal from the HTML buttons
window.attemptEdit = function(id, type, currentQty, currentCost, currentSupplier) {
    pendingEditData = { id, type, qty: currentQty, cost: currentCost, supplier: currentSupplier };
    document.getElementById('adminPinInput').value = '';
    new bootstrap.Modal(document.getElementById('adminPinModal')).show();
};

// 2. Verify the PIN with the backend
document.getElementById('verifyPinBtn').addEventListener('click', async () => {
    const pin = document.getElementById('adminPinInput').value;
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        
        if (response.ok) {
            // PIN Correct! Hide PIN modal and show Edit modal
            bootstrap.Modal.getInstance(document.getElementById('adminPinModal')).hide();
            
            document.getElementById('editTargetId').value = pendingEditData.id;
            document.getElementById('editTargetType').value = pendingEditData.type;
            document.getElementById('editQtyInput').value = pendingEditData.qty;
            
            if (pendingEditData.type === 'purchase') {
                document.getElementById('editPurchaseFields').classList.remove('d-none');
                document.getElementById('editCostInput').value = pendingEditData.cost;
                document.getElementById('editSupplierInput').value = pendingEditData.supplier;
            } else {
                document.getElementById('editPurchaseFields').classList.add('d-none');
            }
            
            new bootstrap.Modal(document.getElementById('editLedgerModal')).show();
        } else {
            alert("Incorrect Admin PIN.");
        }
    } catch (error) { console.error(error); }
});

// 3. Save the Correction
document.getElementById('saveLedgerEditBtn').addEventListener('click', async () => {
    const id = document.getElementById('editTargetId').value;
    const type = document.getElementById('editTargetType').value;
    const qty = parseInt(document.getElementById('editQtyInput').value);
    
    let apiUrl = '';
    let payload = { quantity: qty }; // For sales

    if (type === 'purchase') {
        apiUrl = `/api/admin/purchases/${id}`;
        payload = { 
            newQty: qty, 
            newCost: parseFloat(document.getElementById('editCostInput').value), 
            newSupplier: document.getElementById('editSupplierInput').value 
        };
    } else {
        apiUrl = `/api/admin/sales/${id}`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editLedgerModal')).hide();
            alert("Record successfully corrected! Inventory has been automatically recalculated.");
            
            // Refresh everything so the dashboard math updates instantly
            if (typeof loadSalesLedger === 'function') loadSalesLedger();
            if (typeof loadPurchaseLedger === 'function') loadPurchaseLedger();
            if (typeof loadProducts === 'function') loadProducts();
            if (typeof loadDashboardSummary === 'function') loadDashboardSummary();
        } else {
            alert("Failed to correct ledger.");
        }
    } catch (error) { console.error(error); }
});

// Initialize the workspace when the app loads
loadStickyNote();
// Initialize on page load
loadProducts();
loadDashboardSummary();
loadDashboardCharts();