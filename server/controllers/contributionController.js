const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

module.exports = { getMemberContributions }