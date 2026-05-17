
const express = require('express')
const router = express.Router()
const { getContributionAnalytics , getPayoutAnalytics } = require('../controllers/analyticsController')
const { verifyToken } = require('../middleware/authMiddleware')

router.get('/contributions', verifyToken, getContributionAnalytics)
router.get('/payouts' , verifyToken ,getPayoutAnalytics )

module.exports = router