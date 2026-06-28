// public/js/app.js

// ==========================================
// 1. FETCH & RENDER PRODUCTS
// ==========================================
async function loadProducts() {
    try {
        // Call our Express API (the Waiter)
        const response = await fetch('/api/products');
        const products = await response.json();

        // Update the dashboard count
        document.getElementById('totalProductsText').innerText = products.length + " Items";

        const tableBody = document.getElementById('productTableBody');
        tableBody.innerHTML = ''; // Clear the table before loading

        // Loop through the array of SQLite data and build HTML rows
        for (const product of products) {
            
            // Determine stock badge color based on quantity
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
            // Add the row to the table
            tableBody.innerHTML += row;
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// ==========================================
// 2. ADD NEW PRODUCT LOGIC
// ==========================================
document.getElementById('saveProductBtn').addEventListener('click', async () => {
    // Gather data from the form
    const newProduct = {
        item_code: document.getElementById('itemCodeInput').value,
        item_name: document.getElementById('itemNameInput').value,
        cost_price: parseFloat(document.getElementById('costPriceInput').value),
        srp: parseFloat(document.getElementById('srpInput').value),
        current_stock: 0 // Starts at 0
    };

    try {
        // Send a POST request to the API
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            // Close the Bootstrap modal safely
            const modalElement = document.getElementById('addProductModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Clear the form inputs
            document.getElementById('addProductForm').reset();

            // Reload the table to show the new item instantly!
            loadProducts();
        }
    } catch (error) {
        console.error("Error saving product:", error);
    }
});

// ==========================================
// 3. TRANSACTION LOGIC (SALES/PURCHASES)
// ==========================================
let currentTransactionModal; // To hold the Bootstrap modal instance

// This runs when you click the "Transact" button on a specific table row
function openTransactionModal(itemCode, itemName) {
    document.getElementById('transactionItemCode').value = itemCode;
    document.getElementById('transactionItemName').innerText = `Item: ${itemName}`;
    document.getElementById('transactionQuantity').value = 1;

    // Open the modal using Bootstrap's JS API
    currentTransactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    currentTransactionModal.show();
}

// NEW: Listen for dropdown changes to show/hide the Purchase fields
document.getElementById('transactionType').addEventListener('change', function() {
    const purchaseFields = document.getElementById('purchaseFields');
    if (this.value === 'purchase') {
        purchaseFields.classList.remove('d-none'); // Show fields
    } else {
        purchaseFields.classList.add('d-none');    // Hide fields
    }
});

// UPDATED: Transaction confirmation logic
document.getElementById('saveTransactionBtn').addEventListener('click', async () => {
    const itemCode = document.getElementById('transactionItemCode').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);

    // Base data needed for both Sales and Purchases
    const transactionData = {
        item_code: itemCode,
        quantity: quantity
    };

    // PHASE 4 ADDITION: If it's a purchase, grab the extra financial data
    if (type === 'purchase') {
        transactionData.supplier = document.getElementById('transactionSupplier').value;
        transactionData.cost_price = parseFloat(document.getElementById('transactionCostPrice').value);
        
        // Simple validation to ensure they don't leave it blank
        if (!transactionData.supplier || !transactionData.cost_price) {
            alert("Please enter both Supplier and Cost Price for restocks.");
            return;
        }
    }

    const apiUrl = type === 'sale' ? '/api/transactions/sale' : '/api/transactions/purchase';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            currentTransactionModal.hide(); // Hide the pop-up
            
            // Clear the inputs for the next time
            document.getElementById('transactionSupplier').value = '';
            document.getElementById('transactionCostPrice').value = '';
            document.getElementById('transactionType').value = 'sale'; 
            document.getElementById('purchaseFields').classList.add('d-none');
            
            loadProducts();         // <-- This updates the Table!
            loadDashboardSummary(); // <-- This updates the Math instantly!
        } else {
            alert("Transaction failed. Check server console.");
        }
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
});

// ==========================================
// 4. INITIALIZE DASHBOARD
// ==========================================
// When the page first loads, fetch the data immediately
loadProducts();

// ==========================================
// 5. SIDEBAR NAVIGATION LOGIC (Single Page App)
// ==========================================
function switchView(viewId, linkId, titleText) {
    // 1. Hide ALL 4 views (Put the invisibility cloak on everything)
    document.getElementById('view-dashboard').classList.add('d-none');
    document.getElementById('view-inventory').classList.add('d-none');
    document.getElementById('view-sales').classList.add('d-none'); 
    document.getElementById('view-expenses').classList.add('d-none'); // Added this!
    
    // 2. Show the requested view (Take the cloak off the one we want)
    document.getElementById(viewId).classList.remove('d-none');
    
    // 3. Reset ALL 4 sidebar links to grey
    document.getElementById('nav-dashboard').className = 'nav-link text-dark';
    document.getElementById('nav-inventory').className = 'nav-link text-dark';
    document.getElementById('nav-sales').className = 'nav-link text-dark';    
    document.getElementById('nav-expenses').className = 'nav-link text-dark'; // Added this!
    
    // 4. Highlight the clicked link in blue
    document.getElementById(linkId).className = 'nav-link active';

    // 5. Change the top title
    document.getElementById('pageTitle').innerText = titleText;
}

// Attach event listeners to ALL FOUR buttons
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

// NEW: The Expenses Link Listener
document.getElementById('nav-expenses').addEventListener('click', () => {
    switchView('view-expenses', 'nav-expenses', 'Operating Expenses');
    loadExpenses(); // Fetches the data when they click the tab
});

// ==========================================
// 6. FETCH PHASE 5 FINANCIAL REPORTS
// ==========================================
async function loadDashboardSummary() {
    try {
        const response = await fetch('/api/reports/summary');
        const data = await response.json();

        // This built-in JS tool formats raw numbers into perfect Philippine Pesos!
        const currencyFormatter = new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        });

        // Update the HTML text with the real numbers from your backend
        document.getElementById('totalSalesText').innerText = currencyFormatter.format(data.total_sales || 0);
        document.getElementById('netProfitText').innerText = currencyFormatter.format(data.net_amount || 0);
        
    } catch (error) {
        console.error("Error loading financial summary:", error);
    }
}

// Call this when the page first loads
loadDashboardSummary();

// ==========================================
// 7. FETCH DAILY REPORTS (Sales & Purchases Tab)
// ==========================================
async function loadDailyReports() {
    try {
        const response = await fetch('/api/reports/daily');
        const dailyData = await response.json();

        const tableBody = document.getElementById('dailyReportTableBody');
        tableBody.innerHTML = ''; // Clear table before loading

        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

        for (const day of dailyData) {
            // Determine if profit is positive (green) or negative (red)
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
    } catch (error) {
        console.error("Error loading daily reports:", error);
    }
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
    } catch (error) {
        console.error("Error loading expenses:", error);
    }
}

document.getElementById('saveExpenseBtn').addEventListener('click', async () => {
    const expenseData = {
        description: document.getElementById('expenseDescInput').value,
        amount: parseFloat(document.getElementById('expenseAmountInput').value)
    };

    if (!expenseData.description || !expenseData.amount) {
        alert("Please enter a description and an amount.");
        return;
    }

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        if (response.ok) {
            // Hide modal and clear inputs
            bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
            document.getElementById('expenseDescInput').value = '';
            document.getElementById('expenseAmountInput').value = '';
            
            // Reload table and update dashboard math
            loadExpenses();
            loadDashboardSummary();
        }
    } catch (error) {
        console.error("Error saving expense:", error);
    }
});