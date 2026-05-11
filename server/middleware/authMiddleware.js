const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const admin = require('../config/firebase')
const requireAdmin = async (req, res, next) => { 
  const { groupId } = req.params; // Get the group from the URL
  
  try {
    // 1. Get the logged-in user from the database
    const requester = await prisma.user.findUnique({
      where: { firebaseId: req.user.uid }
    });

    if (!requester) return res.status(403).json({ error: 'User not found' });

    // 2. Check if the REQUESTER is an admin in this group
    const membership = await prisma.groupMember.findUnique({
      where: { 
        userId_groupId: { 
          userId: requester.id, // Use the ID of the person logged in
          groupId: groupId 
        } 
      }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can assign roles' });
    }

    next(); // All good, proceed to assignRole controller
  } catch (error) {
    console.error('requireAdmin error', error);
    res.status(500).json({ error: 'Failed to verify admin role' });
  }
}

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]
  console.log('verifyToken called, token exists:', !!token)
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
