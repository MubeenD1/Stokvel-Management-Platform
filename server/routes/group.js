const express = require('express')
const router = express.Router()
const { createGroup } = require('../controllers/groupControllers')
router.post('/group', createGroup);

module.exports = router