const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.get('/', noteController.getNote);
router.put('/', noteController.updateNote);

module.exports = router;