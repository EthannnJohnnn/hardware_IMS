const express = require('express');
const router = express.Router();
const repackController = require('../controllers/repackController');

router.post('/', repackController.createRepack);

module.exports = router;