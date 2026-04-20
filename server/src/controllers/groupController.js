const prisma = require('../../lib/prisma');
const { v4: uuidv4 } = require('uuid');
//const prisma = new PrismaClient();
const prisma = new PrismaClient();
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { sendMeetingNotification } = require('../utils/notificationService');

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

        console.log(groups);
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
                nextMeetingDate: group.nextMeetingDate,
                payoutOrder: group.payoutOrder,
            },
        });

    } catch (error) {
        console.error('getGroupSettings error:', error);
        return 
        
        
        
        
        
        
        
        
        
        
        
        
        res.status(500).json({ error: 'Internal server error' });
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
                nextMeetingDate,
                contributionAmount,
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
// async function fetchUserGroups(req, res) {
//   const firebaseUid = req.user.uid;

//   try {
//     const user = await prisma.user.findUnique({
//       where: { firebaseId: firebaseUid }, // whatever this field is called in your User model
//       select: { id: true },
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const memberships = await prisma.groupMember.findMany({
//       where: { userId: user.id }, 
//       include: {
//         group: {
//           include: {
//             _count: { select: { members: true } },
//           },
//         },
//       },
//     });

//     const groups = memberships.map(m => ({
//       ...m.group,
//       myRole: m.role,
//       joinedAt: m.joinedAt,
//     }));

//     return res.status(200).json({
//       message: "Fetched groups successfully",
//       groups,
//     });
//   } catch (error) {
//     console.error("fetchUserGroups error:", error);
//     return res.status(500).json({ error: "Failed to fetch your groups, please refresh your page" });
//   }
// }

async function getGroupById(req, res) {
    const gId = req.params.id;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    try {
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

        return res.status(200).json({ groupMembers });

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
//module.exports = { fetchUserGroups, createGroup, joinGroup, getGroupSettings, updateGroupSettings };
module.exports = { getGroupById , getGroups, createGroup, joinGroup, getGroupSettings, updateGroupSettings, getGroupContributions  };


async function refreshInviteCode(req, res) {

    const {groupId} =req.params;
    const firebaseId=req.user.uid;
    try {
        // Verify user is ADMIN of this specific group 
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        const isAdmin = group.members.some(m => m.userId === firebaseId && m.role === 'ADMIN');
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

module.exports = {createGroup, joinGroup, getGroupSettings, updateGroupSettings, refreshInviteCode };
