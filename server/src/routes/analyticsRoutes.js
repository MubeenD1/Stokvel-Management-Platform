
const express = require('express')
const router = express.Router()
const { getContributionCompliance , getContributionAnalytics , getPayoutAnalytics } = require('../controllers/analyticsController')
const { verifyToken } = require('../middleware/authMiddleware')

router.get('/contributions', verifyToken, getContributionAnalytics)
router.get('/payouts' , verifyToken ,getPayoutAnalytics )
// GET /api/analytics/compliance/:groupId
router.get('/compliance/:groupId', verifyToken, getContributionCompliance);

module.exports = router