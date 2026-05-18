const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { refreshInviteCode}=require('../controllers/groupController');

//const {fetchUserGroups, createGroup, joinGroup, getGroupSettings,updateGroupSettings } = require('../controllers/groupController');
const {addMinutes, createMeeting , getMeetings , getGroupById , getGroups, createGroup, joinGroup, getGroupSettings, getGroupContributions, updateGroupSettings, getNotifications } = require('../controllers/groupController');
const { updateContributionStatus } = require('../controllers/groupController');
const { initiatePayout, getPayoutHistory, getEligibleMembers, getPastPayouts, getUpcomingPayouts } = require('../../controllers/payoutController')
// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('getGroups:', typeof getGroups);
console.log('joinGroup:', typeof joinGroup);
console.log('getGroupSettings:', typeof getGroupSettings);
console.log('updateGroupSettings:', typeof updateGroupSettings);
// POST group join and create 
router.post('/create', verifyToken , createGroup);
// GET Groups
console.log('refreshInviteCode:', typeof refreshInviteCode);

// POST /api/groups/join
router.post('/join', verifyToken, joinGroup);
router.post('/:groupId/invite', verifyToken, refreshInviteCode);
router.post('/:id/create-meeting' , verifyToken , createMeeting);
//When treasurer clicks pay
router.post('/:groupId/payouts/initiate', initiatePayout);

// GET notifications for current user
router.get('/notifications', verifyToken, getNotifications);  
router.get('/', verifyToken, getGroups);

// GET group settings
router.get('/', verifyToken, getGroups);

router.get('/:groupId/settings', verifyToken, getGroupSettings);
router.get('/:groupId/contributions', verifyToken, getGroupContributions);
router.get('/:groupId/payouts/history', verifyToken, getPayoutHistory);
router.get('/:groupId/payouts/eligible', verifyToken, getEligibleMembers);
router.get('/:groupId/payouts/pastpayouts', verifyToken, getPastPayouts);
router.get('/:groupId/payouts/upcoming', verifyToken, getUpcomingPayouts);
router.get('/:id/meetings', verifyToken ,getMeetings);
router.get('/:id' , verifyToken , getGroupById);





// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);
router.patch('/:id/meetings/:meetingId/minutes', verifyToken, addMinutes);

// PUT contribution status
router.put('/:groupId/contributions/:contributionId/status', verifyToken, updateContributionStatus);
module.exports = router;