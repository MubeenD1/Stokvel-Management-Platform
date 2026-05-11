const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getSarbRates } = require('../controllers/sarbController');

// GET /api/sarb/rates
// protected route (user must be logged in to view the rates)
router.get('/rates', verifyToken, getSarbRates);

module.exports = router;