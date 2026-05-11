const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/authMiddleware')
const { getMemberContributions } = require('../controllers/contributionController')

router.get('/:groupId', verifyToken, getMemberContributions)

module.exports = router