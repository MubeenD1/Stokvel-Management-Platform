const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { joinGroup, getGroupSettings,updateGroupSettings } = require('../controllers/groupController');

// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('joinGroup:', typeof joinGroup);
console.log('getGroupSettings:', typeof getGroupSettings);
console.log('updateGroupSettings:', typeof updateGroupSettings);
// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);
// GET group settings
router.get('/:groupId/settings', verifyToken, getGroupSettings);

// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);
module.exports = router;