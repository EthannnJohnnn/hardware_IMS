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

// This runs when you click "Confirm" inside the transaction modal
document.getElementById('saveTransactionBtn').addEventListener('click', async () => {
    const itemCode = document.getElementById('transactionItemCode').value;
    const type = document.getElementById('transactionType').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);

    const transactionData = {
        item_code: itemCode,
        quantity: quantity
    };

    // Determine the correct API route based on the dropdown selection
    const apiUrl = type === 'sale' ? '/api/transactions/sale' : '/api/transactions/purchase';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            currentTransactionModal.hide(); // Hide the pop-up
            loadProducts(); // Refresh the table to see the math updated instantly!
        } else {
            alert("Transaction failed. Check console for details.");
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