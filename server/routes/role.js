const express = require('express')
const router  = express.Router()
const {assignRole} = require('../controllers/roleController')
const {verifyToken, requireAdmin} = require('../middleware/authMiddleware')

router.put('/:groupId/members/:userId/role', verifyToken, requireAdmin, assignRole)

module.exports = router