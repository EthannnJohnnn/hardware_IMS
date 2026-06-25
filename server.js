const express = require('express');
const cors = require('cors');
const db = require('./src/config/database'); 

// IMPORT YOUR NEW ROUTES HERE
const productRoutes = require('./src/routes/productRoute'); 

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

// TELL EXPRESS TO USE YOUR ROUTES HERE
// This means every route inside that file will start with '/api' 
// (e.g., http://localhost:3000/api/products)
app.use('/api', productRoutes);

app.get('/', (req, res) => {
    res.send('Hardware IMS Backend is officially running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running live on http://localhost:${PORT}`);
});