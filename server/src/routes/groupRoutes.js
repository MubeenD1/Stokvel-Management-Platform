const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    addMinutes,
    createMeeting,
    getMeetings,
    getGroupById,
    getGroups,
    createGroup,
    joinGroup,
    getGroupSettings,
    getGroupContributions,
    updateGroupSettings,
    refreshInviteCode,
    getNotifications,
    updateContributionStatus,
} = require('../controllers/groupController');

// POST group join and create
router.post('/join', verifyToken, joinGroup);
router.post('/create', verifyToken, createGroup);
router.post('/:groupId/invite', verifyToken, refreshInviteCode);
router.post('/:id/create-meeting', verifyToken, createMeeting);

// GET notifications for current user
router.get('/notifications', verifyToken, getNotifications);

// GET groups
router.get('/', verifyToken, getGroups);

// GET group settings
router.get('/:groupId/settings', verifyToken, getGroupSettings);
router.get('/:groupId/contributions', verifyToken, getGroupContributions);
router.get('/:id/meetings', verifyToken, getMeetings);
router.get('/:id', verifyToken, getGroupById);

// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);
router.put('/:groupId/contributions/:contributionId/status', verifyToken, updateContributionStatus);
router.patch('/:id/meetings/:meetingId/minutes', verifyToken, addMinutes);

module.exports = router;