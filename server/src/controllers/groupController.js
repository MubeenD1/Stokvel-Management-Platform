const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        const group = await prisma.group.findUnique({
            where: { inviteCode },
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

// this will fetch all groups that the logged in user belongs to
async function getUserGroups(req, res) {
    const firebaseId = req.user.uid;

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId },
            include: {
                groups: {
                    include: {
                        group: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groups = user.groups.map((membership) => ({
            id: membership.group.id,
            name: membership.group.name,
            role: membership.role,
            joinedAt: membership.joinedAt,
        }));

        return res.status(200).json({ groups });

    } catch (error) {
        console.error('getUserGroups error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { joinGroup, getUserGroups };