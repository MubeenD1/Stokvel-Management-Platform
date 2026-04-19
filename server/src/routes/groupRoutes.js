const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
//const {fetchUserGroups, createGroup, joinGroup, getGroupSettings,updateGroupSettings } = require('../controllers/groupController');
const { addMinutes , getMeetings, createMeeting , getGroupById , getGroups, createGroup, joinGroup, getGroupSettings, updateGroupSettings } = require('../controllers/groupController');

// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('getGroups:', typeof getGroups);
console.log('joinGroup:', typeof joinGroup);
console.log('getGroupSettings:', typeof getGroupSettings);
console.log('updateGroupSettings:', typeof updateGroupSettings);
// POST group join and create 
router.post('/join', verifyToken, joinGroup);
router.post('/create', verifyToken , createGroup);
router.post('/:id/create-meeting' , verifyToken , createMeeting);
// GET Groups
//router.get('/me', verifyToken, fetchUserGroups);
// GET group settings
router.get('/', verifyToken, getGroups);

router.get('/:groupId/settings', verifyToken, getGroupSettings);
router.get('/:id' , verifyToken , getGroupById);
router.get('/:id/meetings', verifyToken ,getMeetings);


// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);
router.patch('/:id/meetings/:meetingId/minutes', verifyToken, addMinutes);
module.exports = router;