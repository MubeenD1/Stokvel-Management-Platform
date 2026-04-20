const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient();

const updateContributionStatus = async (req, res) => {
    const {groupId, contributionId} = req.params;
    const {status} = req.body;

    const validStatuses = ['CONFIRMED', 'MISSED', 'PENDING'];
    if (!validStatuses.includes(status)) return res.status(400).json({error: "Invalid Status Update."})
    
    try {
        const userFirebaseId = req.user.id;

        const requester = await prisma.groupMember.findFirst({
            where: {
                groupId: groupId,
                user: {firebaseId: userFirebaseId}
            }
        });

        if (!requester || (requester.role !== 'TREASURER' && requester.role !== 'ADMIN')) {
            return res.status(403).json({error: "Access Denied: Only Admins or Treasurers can verify contributions"})
        }

        const updatedContribution = await prisma.contribution.update({
            where: {id: contributionId},
            data: {
                status: status,
                confirmedBy: requester.id,
            },
            include: {
                treasurer: {
                    include: {user: true}
                }
            }
        });

        res.json(updatedContribution);
    } catch (error) {
        console.error('🔥 Contribution Update Error:', error);
        res.status(500).json({ error: "Failed to verify contribution." });
    }
};

module.exports = {updateContributionStatus}

