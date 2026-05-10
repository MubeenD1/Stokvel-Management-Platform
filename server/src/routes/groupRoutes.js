const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { joinGroup, getUserGroups, getGroupById } = require('../controllers/groupController');

// GET /api/groups - fetch all groups for the logged in user
router.get('/', verifyToken, getUserGroups);

// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);

// GET /api/groups/:groupId - fetch a single group by id
router.get('/:groupId', verifyToken, getGroupById);

module.exports = router;