const { PrismaClient } = require('../lib/prisma')
const prisma = new PrismaClient()

async function loginOrRegister(req, res) {
  try {
    const { uid, email } = req.user

    // if user exists return them, if not create them
    let user = await prisma.user.findUnique({
      where: { firebaseId: uid }
    })

   if (!user) {
 	 user = await prisma.user.create({
		data: {
      		    firebaseId: uid,
      		    email: email,
    		}
  	 })
    } 

    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

module.exports = { loginOrRegister }
