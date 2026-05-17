
const prisma = require('../../lib/prisma')
const { getContributionData , getPayoutData } = require('../utils/analyticsService')
prisma

const getContributionAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      memberId,   // "all" or a specific memberId
      statuses,   // "all" or comma-separated e.g. "PENDING,CONFIRMED"
      groupId
    } = req.query

    // Validate required fields
    if (!startDate || !endDate || !groupId) {
      return res.status(400).json({ error: 'startDate, endDate and groupId are required' })
    }

    // Validate date range max 6 months
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

    if (diffMonths > 6) {
      return res.status(400).json({ error: 'Date range cannot exceed 6 months' })
    }

    if (start > end) {
      return res.status(400).json({ error: 'startDate cannot be after endDate' }) 
    }

    const filters = {
      startDate: start,
      endDate: end,
      memberId: memberId === 'all' ? null : memberId.split(','),
      statuses: statuses === 'all' ? null : statuses.split(','),
      groupId
    }

    const data = await getContributionData(filters)
    return res.status(200).json(data)

  } catch (error) {
    console.error('Error fetching contribution analytics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const getPayoutAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      memberId,   // "all" or a specific memberId
      statuses,   // "all" or comma-separated e.g. "PENDING,COMPLETED,FAILED"
      groupId
    } = req.query

    // Validate required fields
    if (!startDate || !endDate || !groupId) {
      return res.status(400).json({ error: 'startDate, endDate and groupId are required' })
    }

    // Validate date range max 6 months
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

    if (diffMonths > 6) {
      return res.status(400).json({ error: 'Date range cannot exceed 6 months' })
    }

    if (start > end) {
      return res.status(400).json({ error: 'startDate cannot be after endDate' })
    }

    // Build filter packet using identical logic mapping to your getPayoutData service setup
    const filters = {
      startDate: start,
      endDate: end,
      memberId: memberId === 'all' ? null : memberId.split(','),
      
      // Convert 'COMPLETED' to 'SUCCESS' to match your Prisma enum definition exactly
      statuses: statuses === 'all' 
        ? null 
        : statuses.split(',').map(s => {
            const clean = s.trim().toUpperCase();
            return clean === 'COMPLETED' ? 'SUCCESS' : clean;
          }),
      groupId
    }

    const data = await getPayoutData(filters)
    return res.status(200).json(data)

  } catch (error) {
    console.error('Error fetching payout analytics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getContributionCompliance(req, res) {
    const { groupId } = req.params;
    const firebaseId = req.user.uid;

    try {
        // verify the user is a member of this group
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
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // fetch all members of the group
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { user: true },
        });

        // fetch all contributions for this group
        const contributions = await prisma.contribution.findMany({
            where: { groupId },
            orderBy: { date: 'asc' },
        });

        // get unique months from contributions
        const months = [...new Set(contributions.map(c => {
            const d = new Date(c.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }))].sort();

        // build compliance data for each member
        const complianceData = members.map(member => {
            const memberContributions = contributions.filter(c => c.memberId === member.id);

            const monthlyStatus = months.map(month => {
                const contribution = memberContributions.find(c => {
                    const d = new Date(c.date);
                    const cMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return cMonth === month;
                });

                return {
                    month,
                    status: contribution ? contribution.status : 'MISSED',
                    amount: contribution ? contribution.amount : 0,
                };
            });

            const confirmed = monthlyStatus.filter(m => m.status === 'CONFIRMED').length;
            const complianceRate = months.length > 0
                ? Math.round((confirmed / months.length) * 100)
                : 0;

            return {
                memberId: member.id,
                email: member.user.email,
                role: member.role,
                monthlyStatus,
                complianceRate,
                totalContributed: memberContributions
                    .filter(c => c.status === 'CONFIRMED')
                    .reduce((sum, c) => sum + c.amount, 0),
            };
        });

        return res.status(200).json({
            months,
            complianceData,
            groupId,
        });

    } catch (error) {
        console.error('getContributionCompliance error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { 
  getContributionAnalytics,
  getPayoutAnalytics,
  getContributionCompliance 
}