const express = require('express');
const router = express.Router();
const { initiatePayment, handleNotify } = require('../controllers/payfastControllers');

router.post('/initiate', initiatePayment);
router.post('/notify', handleNotify);

module.exports = router;