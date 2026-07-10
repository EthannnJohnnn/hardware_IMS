const express = require('express');
const router = express.Router();
const arController = require('../controllers/arController');
const { verifyAdminPin } = require('../middleware/authMiddleware'); // ✨ NEW Gatekeeper

// Updated to match the new controller function names!
router.get('/', arController.getAllAR);
router.post('/', arController.addDebt);
router.put('/:id/pay', arController.markAsPaid);

// ✨ NEW: Phase 20 Protected Edit Route
router.put('/edit', verifyAdminPin, arController.editDebt);

module.exports = router;