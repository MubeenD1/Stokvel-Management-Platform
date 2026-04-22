const prisma = require('../../lib/prisma');
const { v4: uuidv4 } = require('uuid');
//const prisma = new PrismaClient();
//const prisma = new PrismaClient();
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { sendMeetingNotification } = require('../utils/notificationService');
const { updateContributionStatus } = require('../../controllers/contributionController');

// this will handle the logic for joining a group via the invite code
async function joinGroup(req, res) {
    const { inviteCode } = req.body;
    const firebaseId = req.user.uid;

    // this will verify that an invite code was sent
    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' });
    }

    try {
        // this will find the user in the database using their firebase Id
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // this will find the group that matches the invite c createGroup, ode sent
        const iC = inviteCode.trim().toLowerCase();
        const group = await prisma.group.findUnique({
            where: { inviteCode: iC },
        });

        // this accounts for when no groups are found meaning an invalid code
        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        // this will check if the invite code that was sent has expired
        if (group.inviteCodeExpiry && new Date() > group.inviteCodeExpiry) {
            return res.status(400).json({ error: 'Invite code has expired' });
        }

        // this will check if the user is an existing member of the group
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: group.id,
                },
            },
        });

        if (existingMember) {
            return res.status(400).json({ error: 'You are already a member of this group' });
        }

        // if not, this will add the user to the group as a member
        await prisma.groupMember.create({
            data: {
                userId: user.id,
                groupId: group.id,
                role: 'MEMBER',
            },
        });

        // return the group details so the frontend can redirect to it
        return res.status(200).json({
            message: 'Successfully joined group',
            group: {
                id: group.id,
                name: group.name,
            },
        });

    } catch (error) {
        console.error('joinGroup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getGroups(req, res) {
    const  firebaseId  = req.user.uid;

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const memberships = await prisma.groupMember.findMany({
            where: {userId: user.id},
            include:{group: true},
        });
        const groups = memberships.map((m) => ({
            id: m.groupId,
            name: m.group.name,
            role: m.role,
            joinedAt: m.joinedAt
        }));

        //console.log(groups);
        return res.status(200).json({groups});
        

    } catch (error) {
        console.error('getGroups error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getGroupSettings(req, res) {
    const { groupId } = req.params;

    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        return res.status(200).json({
            group: {
                id: group.id,
                name: group.name,
                contributionAmount: group.contributionAmount,
                meetingFrequency: group.meetingFrequency,
                payoutOrder: group.payoutOrder,
            },
        });

    } catch (error) {
        //console.error('getGroupSettings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateGroupSettings(req, res) {
    const { groupId } = req.params;
    const { nextMeetingDate, contributionAmount, meetingFrequency, payoutOrder } = req.body;

    try {
        const firebaseId = req.user.uid;

        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentGroup = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { include: { user: true } } }
        });

        // 2. Check if meeting details actually changed
        const isDateChanged = currentGroup.nextMeetingDate !== nextMeetingDate;
        const isFreqChanged = currentGroup.meetingFrequency !== meetingFrequency;

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: {
                contributionAmount: contributionAmount ? parseFloat(contributionAmount) : null,
        meetingFrequency,
        payoutOrder,
            },
        });

        if (isDateChanged || isFreqChanged) {
            const memberEmails = currentGroup.members.map(m => m.user.email);
            
            await sendMeetingNotification(
                memberEmails, 
                updatedGroup.name, 
                { date: nextMeetingDate, frequency: meetingFrequency },
                isDateChanged ? "update" : "schedule"
            );
        }

        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                userId: user.id,
                role: 'ADMIN'
            }
        });

        if (!membership) {
            return res.status(403).json({ error: "Only admins can change group settings" });
        }
        return res.status(200).json({
            message: 'Group settings updated successfully',
            group: updatedGroup,
        });

    } catch (error) {
        console.error('updateGroupSettings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function createGroup(req, res) {
    const firebaseId = req.user.uid;
    const { name } = req.body;


    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: "Group name is required" });
    }

    try {
        // find user
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        //generate code and set expiry
        const inviteCode = await generateUniqueInviteCode();
        const inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        // create group + add creator as ADMIN
        const group = await prisma.group.create({
            data: {
                "name": name.trim(),
                inviteCode,
                inviteCodeExpiry,
                members: {
                    create: {
                        userId: user.id,
                        role: "ADMIN",
                    },
                },
            },
            include: {
                members: true,
            },
        });

        return res.status(201).json({
            message: "Group created successfully",
            group: {
                id: group.id,
                name: group.name,
                inviteCode: group.inviteCode,
                inviteCodeExpiry: group.inviteCodeExpiry,
                members: group.members,
            },
        });

    } catch (error) {
        console.error("createGroup error:", error);
        return res.status(500).json({ error: "Failed to create group" });
    }
}

async function getGroupById(req, res) {
    const gId = req.params.id;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
         const group = await prisma.group.findUnique({
            where: { id: gId },
        });
         const role = await prisma.group.findUnique({
            where: { id: gId },
        });
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId: gId },
            include: {
                user: {
                    select: {
                        email: true,
                        firebaseId: true, //Added for email comparison for assigning roles
                    },
                },
            },
        });
        const firebaseId = req.user.uid;
        const user = await prisma.user.findUnique({ where: { firebaseId } });

        // const membership = await prisma.groupMember.findFirst({
        //     where: { groupId: gId, userId: user.id }
        // });
        const membership = await prisma.groupMember.findFirst({
        where: { 
            groupId: gId, 
            userId: user.id 
        }
});
        return res.status(200).json({ groupMembers, group,role:membership?.role });

    } catch (error) {
        console.error('getGroupById error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const getGroupContributions = async (req, res) => {
    const { groupId } = req.params;

    try {
        const contributions = await prisma.contribution.findMany({
            where: { 
                groupId: groupId 
            },
            include: {
                // Fetches email of person who owes money
                member: { 
                    include: { user: true } 
                },
                // Fetches email of Treasurer who verified it (if any)
                treasurer: { 
                    include: { user: true } 
                }
            },
            orderBy: {
                date: 'asc' // Sorts by due date
            }
        });

        res.json(contributions);

    } catch (error) {
        console.error('🔥 Fetch Contributions Error:', error);
        res.status(500).json({ error: "Failed to load group contributions." });
    }
};

async function refreshInviteCode(req, res) {

    const {groupId} =req.params;
    const firebaseId=req.user.uid;
    try {
        // Verify user is ADMIN of this specific group 
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { 
                members:{
                    include :{user : true}
                }
            }
        });

       const isAdmin = group.members.some(m =>m.user.firebaseId === firebaseId && m.role === 'ADMIN');
        if (!isAdmin) return res.status(403).json({ error: "Only admins can do this" });

        const newCode = await generateUniqueInviteCode();
        const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: { inviteCode: newCode, inviteCodeExpiry: newExpiry },
        });

        res.json({ inviteCode: updatedGroup.inviteCode, expiresAt: updatedGroup.inviteCodeExpiry });
    } catch (error) {
        res.status(500).json({ error: "Failed to refresh code" });
    }
}

async function createMeeting(req,res){
    const gId = req.params.id;
    const firebaseId = req.user.uid;
    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    const { rDate , rLocation , rAgenda } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const membership = await prisma.groupMember.findUnique({
        where: {
            userId_groupId: {
                userId: user.id,
                groupId: gId,
                },
            },
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'TREASURER')) {
        return res.status(403).json({ error: "Not authorized to create meetings" });
        }

      const meeting = await prisma.meeting.create({
        data: {
            groupId: gId,
            date: new Date(rDate),
            location: rLocation,
            agenda: rAgenda,
            createdById: user.id,
        },
        include: {
            Group: true,     
            User: true, 
        },
        });
        return res.status(201).json({
            message : "Meeting Created Successfully",
            meeting,
        });

    } catch (error) {
        console.error("createMeeting error:", error);
        return res.status(500).json({ error: error.message });
    }

}

async function getMeetings(req, res) {
    console.log("params:", req.params);
    console.log("gId:", req.params.id);

    const gId = req.params.id;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
        // 1. Get user from request (IMPORTANT FIX)
        const firebaseId = req.user.uid;

        const user = await prisma.user.findUnique({
            where: { firebaseId },
            select: { id: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Fetch meetings
        const meetings = await prisma.meeting.findMany({
            where: { groupId: gId },
            orderBy : { date : 'desc'},
            include: {
                User: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        // 3. Fetch role in group
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: gId,
                },
            },
            select: {
                role: true,
            },
        });

        return res.status(200).json({
            meetings,
            role: membership?.role || "MEMBER", // safe fallback
        });

    } catch (error) {
        console.error('getMeetings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function addMinutes(req,res){
    const { id: gId, meetingId } = req.params;
    const { minutes } = req.body;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }
    const firebaseId = req.user.uid;
    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }        

        const membership = await prisma.groupMember.findUnique({
        where: {
            userId_groupId: {
                userId: user.id,
                groupId: gId,
                },
            },
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'TREASURER')) {
            return res.status(403).json({ error: "Not authorized to create add meeting minutes" });
        }
        
        const meeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { minutes },
        });
        return res.status(200).json({ meeting });

    } catch (error) {
        console.error('addMinutes error:', error);
    return res.status(500).json({ error: error.message });
    }
}

module.exports = {addMinutes, createMeeting , getMeetings , getGroupById , getGroups,createGroup, joinGroup, getGroupSettings, updateGroupSettings, refreshInviteCode,getGroupContributions, updateContributionStatus};
