// src/middleware/authMiddleware.js
require('dotenv').config();

const verifyAdminPin = (req, res, next) => {
    // We expect the frontend to send the PIN in the request body
    const { pin } = req.body; 
    const actualAdminPin = process.env.ADMIN_PIN;

    // Check if the PIN is missing or incorrect
    if (!pin || pin !== actualAdminPin) {
        console.warn("Attempted unauthorized edit. Incorrect PIN provided.");
        return res.status(401).json({ error: "Unauthorized: Incorrect Admin PIN" });
    }

    // If the PIN matches, open the gate and move to the controller!
    next(); 
};

module.exports = { verifyAdminPin };