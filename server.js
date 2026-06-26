const express = require('express');
const cors = require('cors');
const db = require('./src/config/database'); 
const productRoutes = require('./src/routes/productRoute'); 

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

// 👇 ADD THIS NEW LINE 👇
// This tells Express to host all your HTML and CSS files!
app.use(express.static('public'));

app.use('/api', productRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server is running live on http://localhost:${PORT}`);
});