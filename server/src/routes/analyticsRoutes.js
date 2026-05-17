
const express = require('express')
const router = express.Router()
const { getContributionAnalytics } = require('../controllers/analyticsController')
const { verifyToken } = require('../middleware/authMiddleware')

router.get('/contributions', verifyToken, getContributionAnalytics)

module.exports = router