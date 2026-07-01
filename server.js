const express = require('express');
const cors = require('cors');
const db = require('./src/config/database'); 

// 1. Import all your clean routes
const productRoutes = require('./src/routes/productRoute'); 
const expenseRoutes = require('./src/routes/expenseRoute');
const arRoutes = require('./src/routes/arRoute');
const reportRoutes = require('./src/routes/reportRoute'); // <-- NEW
const transactionRoutes = require('./src/routes/transactionRoute'); // <-- NEW

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public'));

// 2. Register the routes (The Traffic Cops)
app.use('/api/expenses', expenseRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/reports', reportRoutes); // <-- THIS FIXES THE CHARTS!
app.use('/api/transactions', transactionRoutes); // <-- Connects your sales/purchases
app.use('/api', productRoutes); 

app.listen(PORT, () => {
    console.log(`🚀 Server is running live on http://localhost:${PORT}`);
});