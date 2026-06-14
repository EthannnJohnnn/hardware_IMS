const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send('Hardware IMS Backend is officially running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running live on http://localhost:${PORT}`);
});