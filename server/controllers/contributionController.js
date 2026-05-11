const prisma = require('../lib/prisma');
const { saveContribution } = require('./contributionService');
const{fetchLatestSarbRates} = require('../src/utils/sarbService');
async function getMemberContributions(req, res) {

  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const groupId = req.params.groupId
    const firebaseId = req.user.uid

    const user = await prisma.user.findUnique({
      where: { firebaseId }
    })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const groupMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId
        }
      }
    })
    if (!groupMember) {
      return res.status(403).json({ error: 'You are not a member of this group' })
    }
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    const contributions = await prisma.contribution.findMany({
      where: { memberId: groupMember.id },
      include: {
        treasurer: {
          include: { user: true }
        }
      },
     orderBy: { date: 'desc' }
    })

    const formatted = contributions.map(c => ({
      id: c.id,
      amount: c.amount,
      date: c.date,
      status: c.status,
      confirmedBy: c.treasurer ? c.treasurer.user.email : null,
      createdAt: c.createdAt
    }))

    res.json({
      contributions: formatted,
      groupMemberId: groupMember.id,
      contributionAmount: group.contributionAmount,
    });

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch contributions' })
  }
}
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
            where: { id: contributionId },
            data: {
                status: status,
                confirmedBy: requester.id,
            },
            include: {
                member: { include: { user: true } },  // ← add this
                treasurer: { include: { user: true } }
            }
        });

        res.json(updatedContribution);
    } catch (error) {
        console.error('🔥 Contribution Update Error:', error);
        res.status(500).json({ error: "Failed to verify contribution." });
    }
};

async function createContribution(req, res){


  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const groupId = req.params.groupId
    const firebaseId = req.user.uid

    const user = await prisma.user.findUnique({
      where: { firebaseId }
    })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const groupMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId
        }
      }
    })
    if (!groupMember) {
      return res.status(403).json({ error: 'You are not a member of this group' })
    }

    const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'A valid amount is required' });
  }

  const contribution = await saveContribution({
      amount,
      groupId,
      groupMemberId: groupMember.id,
    });

  res.status(201).json(contribution);

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch contributions' })
  }

};
async function getSavingsProjection(req, res) {

  try {

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const groupId = req.params.groupId;
    const firebaseId = req.user.uid;

    const user = await prisma.user.findUnique({
      where: { firebaseId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const groupMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId
        }
      }
    });

    if (!groupMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    const contributions = await prisma.contribution.findMany({
      where: {
        memberId: groupMember.id,
        status: 'CONFIRMED'
      }
    });

    const totalContributions = contributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    const rates = await fetchLatestSarbRates();

    const annualRate = rates.repoRate / 100;
    const monthlyRate = annualRate / 12;
    const monthlyContribution = group.contributionAmount || 0;

    const months = 12;

    const futureExistingSavings =
      totalContributions * ((1 + monthlyRate) ** months);

    const futureContributions =
      monthlyContribution *
      (((1 + monthlyRate) ** months - 1) / monthlyRate);

    const projectedSavings =
      futureExistingSavings + futureContributions;
    return res.json({
      totalContributions,
      monthlyContribution,
      repoRate: rates.repoRate,
      projectedSavings: Number(projectedSavings.toFixed(2)),
      projectionMonths: months,
      basedOn: 'SARB Repo Rate'
    });

  } catch (err) {
    console.error('getSavingsProjection error:', err);
    return res.status(500).json({
      error: 'Failed to calculate savings projection'
    });
  }
}

module.exports = { getMemberContributions, updateContributionStatus, createContribution, getSavingsProjection };

