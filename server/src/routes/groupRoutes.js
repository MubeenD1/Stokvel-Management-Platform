const express = require('express');
const router = express.Router;
const{verifyTokens} = require('../middleware/authMiddleware');
const{joinGroup} = require('../controllers/groupController');

router.post('/join,',verifyTokens,joinGroup);

module.exports = router;