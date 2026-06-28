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
                    <td>${product.item_code}</td>
                    <td>${product.item_name}</td>
                    <td>₱${product.cost_price.toFixed(2)}</td>
                    <td>₱${product.srp.toFixed(2)}</td>
                    <td><span class="badge ${stockBadge}">${product.current_stock}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" 
                            onclick="openTransactionModal('${product.item_code}', '${product.item_name}')">
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
// 3. TRANSACTION LOGIC (SALES/PURCHASES)
// ==========================================
let currentTransactionModal; 

function openTransactionModal(itemCode, itemName) {
    document.getElementById('transactionItemCode').value = itemCode;
    document.getElementById('transactionItemName').innerText = `Item: ${itemName}`;
    document.getElementById('transactionQuantity').value = 1;
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
        } else { alert("Transaction failed. Check server console."); }
    } catch (error) { console.error("Error processing transaction:", error); }
});

// ==========================================
// 4. INITIALIZE DASHBOARD
// ==========================================
loadProducts();
loadDashboardSummary();

// ==========================================
// 5. SIDEBAR NAVIGATION LOGIC (Single Page App)
// ==========================================
function switchView(viewId, linkId, titleText) {
    // Hide ALL 5 views
    document.getElementById('view-dashboard').classList.add('d-none');
    document.getElementById('view-inventory').classList.add('d-none');
    document.getElementById('view-sales').classList.add('d-none'); 
    document.getElementById('view-expenses').classList.add('d-none');
    document.getElementById('view-ar').classList.add('d-none'); 
    
    // Show requested view
    document.getElementById(viewId).classList.remove('d-none');
    
    // Reset ALL 5 links
    document.getElementById('nav-dashboard').className = 'nav-link text-dark';
    document.getElementById('nav-inventory').className = 'nav-link text-dark';
    document.getElementById('nav-sales').className = 'nav-link text-dark';    
    document.getElementById('nav-expenses').className = 'nav-link text-dark'; 
    document.getElementById('nav-ar').className = 'nav-link text-dark'; 
    
    // Highlight clicked link
    document.getElementById(linkId).className = 'nav-link active';
    document.getElementById('pageTitle').innerText = titleText;
}

document.getElementById('nav-dashboard').addEventListener('click', () => {
    switchView('view-dashboard', 'nav-dashboard', 'Dashboard Overview');
    loadDashboardSummary(); 
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
// 6. DASHBOARD FINANCIAL SUMMARY
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

// ==========================================
// 7. DAILY REPORTS (Sales Tab)
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
                    <td>${currencyFormatter.format(day.total_revenue)}</td>
                    <td>${currencyFormatter.format(day.total_cogs)}</td>
                    <td class="fw-bold ${profitColor}">${currencyFormatter.format(day.gross_profit)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    } catch (error) { console.error("Error loading daily reports:", error); }
}

// ==========================================
// 8. EXPENSES LOGIC
// ==========================================
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
                    <td>${exp.expense_date}</td>
                    <td>${exp.description}</td>
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
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
            document.getElementById('expenseDescInput').value = '';
            document.getElementById('expenseAmountInput').value = '';
            loadExpenses();
            loadDashboardSummary();
        }
    } catch (error) { console.error("Error saving expense:", error); }
});

// ==========================================
// 9. ACCOUNTS RECEIVABLE LOGIC
// ==========================================
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
                    <td>${debt.date_issued}</td>
                    <td class="fw-bold">${debt.customer_name}</td>
                    <td class="text-muted">${debt.description}</td>
                    <td class="text-warning fw-bold">${currencyFormatter.format(debt.amount)}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="markDebtPaid(${debt.id})">
                            Mark as Paid
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
        const response = await fetch('/api/ar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(debtData)
        });

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