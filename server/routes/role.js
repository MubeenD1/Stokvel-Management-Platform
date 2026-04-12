const express = require('express')
const router  = express.Router()
const {assignRole} = require('../controllers/roleController')
const {verifyToken} = require('../middleware/authMiddleware')

router.put('/:groupId/members/:userId/role', verifyToken, assignRole)

module.exports = router