const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { joinGroup, getUserGroups } = require('../controllers/groupController');

// GET /api/groups - fetch all groups for the logged in user
router.get('/', verifyToken, getUserGroups);

// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);

module.exports = router;