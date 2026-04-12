const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/authMiddleware')
const { loginOrRegister } = require('../controllers/authController')

router.post('/login', verifyToken, loginOrRegister)

module.exports = router
