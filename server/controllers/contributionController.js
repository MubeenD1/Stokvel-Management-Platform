const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// User Story 2 - Katlego: Get member contribution history
async function getMemberContributions(req, res) {
  try {
    const { groupId } = req.params
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

    res.json({ contributions: formatted })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch contributions' })
  }
}

// User Story 1 - Sivunile: Update contribution status
const updateContributionStatus = async (req, res) => {
  const { groupId, contributionId } = req.params
  const { status } = req.body

  const validStatuses = ['CONFIRMED', 'MISSED', 'PENDING']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid Status Update.' })
  }

  try {
    const userFirebaseId = req.user.id

    const requester = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        user: { firebaseId: userFirebaseId }
      }
    })

    if (!requester || (requester.role !== 'TREASURER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Access Denied: Only Admins or Treasurers can verify contributions' })
    }

    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: status,
        confirmedBy: requester.id,
      },
      include: {
        treasurer: {
          include: { user: true }
        }
      }
    })

    res.json(updatedContribution)
  } catch (error) {
    console.error('🔥 Contribution Update Error:', error)
    res.status(500).json({ error: 'Failed to verify contribution.' })
  }
}

module.exports = { getMemberContributions, updateContributionStatus }