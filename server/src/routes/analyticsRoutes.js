const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getContributionCompliance } = require('../controllers/analyticsController');

// GET /api/analytics/compliance/:groupId
router.get('/compliance/:groupId', verifyToken, getContributionCompliance);

module.exports = router;