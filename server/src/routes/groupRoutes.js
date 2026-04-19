const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
//const {fetchUserGroups, createGroup, joinGroup, getGroupSettings,updateGroupSettings } = require('../controllers/groupController');
const { getGroupById , getGroups, createGroup, joinGroup, getGroupSettings, getGroupContributions, updateGroupSettings } = require('../controllers/groupController');
const { updateContributionStatus } = require('../../controllers/contributionController')
// debug - check if functions are loaded correctly
console.log('verifyToken:', typeof verifyToken);
console.log('getGroups:', typeof getGroups);
console.log('joinGroup:', typeof joinGroup);
console.log('getGroupSettings:', typeof getGroupSettings);
console.log('updateGroupSettings:', typeof updateGroupSettings);
// POST group join and create 
router.post('/join', verifyToken, joinGroup);
router.post('/create', verifyToken , createGroup);
// GET Groups
//router.get('/me', verifyToken, fetchUserGroups);
// GET group settings
router.get('/', verifyToken, getGroups);

router.get('/:groupId/settings', verifyToken, getGroupSettings);
router.get('/:id' , verifyToken , getGroupById);
router.get('/:groupId/contributions', verifyToken, getGroupContributions);

// PUT group settings
router.put('/:groupId/settings', verifyToken, updateGroupSettings);

// PUT contribution status
router.put('/:groupId/contributions/:contributionId/status', verifyToken, updateContributionStatus);
module.exports = router;