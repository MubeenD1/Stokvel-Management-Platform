const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/authMiddleware')
const { getMemberContributions } = require('../controllers/contributionController')

router.use((req, res, next) => {
  console.log('Contribution router hit:', req.method, req.path, req.params)
  next()
})

router.get('/:groupId', verifyToken, getMemberContributions)

module.exports = router