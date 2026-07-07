const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');

router.post('/', exchangeController.createExchange);

module.exports = router;