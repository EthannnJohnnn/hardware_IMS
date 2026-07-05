const express = require('express');
const cors = require('cors');
const db = require('./src/config/database'); 

// 1. Import all our clean routes
const productRoutes = require('./src/routes/productRoute'); 
const transactionRoutes = require('./src/routes/transactionRoute');
const reportRoutes = require('./src/routes/reportRoute');
const expenseRoutes = require('./src/routes/expenseRoute');
const arRoutes = require('./src/routes/arRoute');
const ledgerRoutes = require('./src/routes/ledgerRoute'); // <-- NEW LEDGER ROUTE
const noteRoutes = require('./src/routes/noteRoute');
const exportRoutes = require('./src/routes/exportRoute'); // <-- NEW

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public'));

// 2. Register the routes
app.use('/api', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ar', arRoutes); 
app.use('/api/ledger', ledgerRoutes); // <-- WIRE IT UP HERE
app.use('/api/note', noteRoutes);
app.use('/api/export', exportRoutes); // <-- NEW


app.listen(PORT, () => {
    console.log(`🚀 Server is running live on http://localhost:${PORT}`);
});