const prisma = require('../../lib/prisma');
const { randomUUID } = require('crypto');
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { sendMeetingNotification } = require('../utils/notificationService');
const { updateContributionStatus } = require('../../controllers/contributionController');

// this will fetch a single group by its id
async function getGroupById(req, res) {
    const { groupId } = req.params;
    const firebaseId = req.user.uid;

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId,
                },
            },
            include: {
                group: true,
            },
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        return res.status(200).json({
            group: {
                id: membership.group.id,
                name: membership.group.name,
                role: membership.role,
                joinedAt: membership.joinedAt,
            },
        });

    } catch (error) {
        console.error('getGroupById error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// this will handle the logic for joining a group via the invite code
async function joinGroup(req, res) {
    const { inviteCode } = req.body;
    const firebaseId = req.user.uid;

    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const iC = inviteCode.trim();
        const group = await prisma.group.findUnique({
            where: { inviteCode: iC },
        });

        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        if (group.inviteCodeExpiry && new Date() > group.inviteCodeExpiry) {
            return res.status(400).json({ error: 'Invite code has expired' });
        }

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

        await prisma.groupMember.create({
            data: {
                userId: user.id,
                groupId: group.id,
                role: 'MEMBER',
            },
        });

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
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const firebaseId = req.user.uid;

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const memberships = await prisma.groupMember.findMany({
            where: { userId: user.id },
            include: { group: true },
        });

        const groups = memberships.map((m) => ({
            id: m.groupId,
            name: m.group.name,
            role: m.role,
            joinedAt: m.joinedAt,
        }));

        return res.status(200).json({ groups });

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
                isDateChanged ? 'update' : 'schedule'
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
            return res.status(403).json({ error: 'Only admins can change group settings' });
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
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const firebaseId = req.user.uid;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const inviteCode = await generateUniqueInviteCode();
        const inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const group = await prisma.group.create({
            data: {
                name: name.trim(),
                inviteCode,
                inviteCodeExpiry,
                members: {
                    create: {
                        userId: user.id,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                members: true,
            },
        });

        return res.status(201).json({
            message: 'Group created successfully',
            group: {
                id: group.id,
                name: group.name,
                inviteCode: group.inviteCode,
                inviteCodeExpiry: group.inviteCodeExpiry,
                members: group.members,
            },
        });

    } catch (error) {
        console.error('createGroup error:', error);
        return res.status(500).json({ error: 'Failed to create group' });
    }
}

const getGroupContributions = async (req, res) => {
    const { groupId } = req.params;

    try {
        const contributions = await prisma.contribution.findMany({
            where: { groupId: groupId },
            include: {
                member: { include: { user: true } },
                treasurer: { include: { user: true } }
            },
            orderBy: { date: 'asc' }
        });

        res.json(contributions);

    } catch (error) {
        console.error('Fetch Contributions Error:', error);
        res.status(500).json({ error: 'Failed to load group contributions.' });
    }
};

async function refreshInviteCode(req, res) {
    const { groupId } = req.params;
    const firebaseId = req.user.uid;

    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: { include: { user: true } } }
        });

        const isAdmin = group.members.some(m => m.user.firebaseId === firebaseId && m.role === 'ADMIN');
        if (!isAdmin) return res.status(403).json({ error: 'Only admins can do this' });

        const newCode = await generateUniqueInviteCode();
        const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: { inviteCode: newCode, inviteCodeExpiry: newExpiry },
        });

        res.json({ inviteCode: updatedGroup.inviteCode, expiresAt: updatedGroup.inviteCodeExpiry });
    } catch (error) {
        res.status(500).json({ error: 'Failed to refresh code' });
    }
}

async function createMeeting(req, res) {
    const gId = req.params.id;
    const firebaseId = req.user.uid;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    const { rDate, rLocation, rAgenda } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { firebaseId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: user.id, groupId: gId } },
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'TREASURER')) {
            return res.status(403).json({ error: 'Not authorized to create meetings' });
        }

        const meeting = await prisma.meeting.create({
            data: {
                groupId: gId,
                date: new Date(rDate),
                location: rLocation,
                agenda: rAgenda,
                createdById: user.id,
            },
            include: { Group: true, User: true },
        });

        return res.status(201).json({ message: 'Meeting Created Successfully', meeting });

    } catch (error) {
        console.error('createMeeting error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function getMeetings(req, res) {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!req.params?.id) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    const gId = req.params.id;

    try {
        const firebaseId = req.user.uid;
        const user = await prisma.user.findUnique({
            where: { firebaseId },
            select: { id: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const meetings = await prisma.meeting.findMany({
            where: { groupId: gId },
            orderBy: { date: 'desc' },
            include: { User: { select: { email: true } } },
        });

        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: user.id, groupId: gId } },
            select: { role: true },
        });

        return res.status(200).json({
            meetings,
            role: membership?.role || 'MEMBER',
        });

    } catch (error) {
        console.error('getMeetings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function addMinutes(req, res) {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: gId, meetingId } = req.params;
    const { minutes } = req.body;

    if (!gId) {
        return res.status(400).json({ error: 'Group ID is required' });
    }

    const firebaseId = req.user.uid;

    try {
        const user = await prisma.user.findUnique({ where: { firebaseId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: user.id, groupId: gId } },
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'TREASURER')) {
            return res.status(403).json({ error: 'Not authorized to add meeting minutes' });
        }

        const meeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { minutes },
        });

        return res.status(201).json({ message: 'successful', meeting });

    } catch (error) {
        console.error('addMinutes error:', error);
        return res.status(500).json({ error: error.message });
    }
}

const getNotifications = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId: req.user.uid },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const notifications = await prisma.notification.findMany({
            where: { recipientId: user.id },
            orderBy: { sentAt: 'desc' },
            include: { meeting: { include: { Group: true } } },
        });

        res.json({ notifications });
    } catch (err) {
        console.error('getNotifications error:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

module.exports = {
    addMinutes,
    createMeeting,
    getMeetings,
    getGroupById,
    getGroups,
    createGroup,
    joinGroup,
    getGroupSettings,
    updateGroupSettings,
    refreshInviteCode,
    getGroupContributions,
    updateContributionStatus,
    getNotifications,
};