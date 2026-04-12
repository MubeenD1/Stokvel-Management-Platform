const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { joinGroup } = require('../controllers/groupController');

// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('joinGroup:', typeof joinGroup);

// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);

module.exports = router;