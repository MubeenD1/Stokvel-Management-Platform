const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { createGroup, joinGroup, getGroupSettings,updateGroupSettings } = require('../controllers/groupController');
const { joinGroup,refreshInviteCode}=require('../controllers/groupController');

// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('joinGroup:', typeof joinGroup);
console.log('getGroupSettings:', typeof getGroupSettings);
console.log('updateGroupSettings:', typeof updateGroupSettings);
// POST group join and create 
router.post('/join', verifyToken, joinGroup);
router.post('/create', verifyToken , createGroup);
// GET Groups
console.log('refreshInviteCode:', typeof refreshInviteCode);

// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);
router.post('/:groupId/invite', verifyToken, groupController.refreshInviteCode);

// GET group settings
router.get('/:groupId/settings', verifyToken, getGroupSettings);

// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);
module.exports = router;