// public/js/app.js

// ==========================================
// 1. FETCH & RENDER PRODUCTS
// ==========================================
async function loadProducts() {
    try {
        // Call our Express API (the Waiter)
        const response = await fetch('/api/products');
        const products = await response.json();

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
            currentTransactionModal.hide(); 
            // Clear the inputs for the next time
            document.getElementById('transactionSupplier').value = '';
            document.getElementById('transactionCostPrice').value = '';
            document.getElementById('transactionType').value = 'sale'; // Reset to default
            document.getElementById('purchaseFields').classList.add('d-none');
            
            loadProducts(); 
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