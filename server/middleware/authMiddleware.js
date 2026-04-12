const { Prisma } = require('@prisma/client')
const admin = require('../config/firebase')
const requireAdmin = async (req, res, next) => { 
  const {userId, groupId} = req.params

  try {
    //To-do
    // const member = await Prisma.groupMember.findUnique({
    //   where: { userId_groupId: {userId, groupId}}
    // })
    // if (!member || member.role !== 'ADMIN') return res.status(403).json({error: 'Only admins can assiugn roles'})
    // next()
    //Placeholder
  } catch (error) {
    res.status(500).json({error: 'Failed to verify admin role'})
  }
}

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { verifyToken, requireAdmin }
