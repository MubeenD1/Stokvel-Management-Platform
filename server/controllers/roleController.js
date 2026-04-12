const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient

const assignRole = async (req, res) => {
    const {groupId, userId } = req.params
    const {role} = req.body

    //Validating 

    const validRoles = ['ADMIN', 'TREASURER', 'MEMBER']
    if (!validRoles.includes(role)) return res.status(400).json({error: 'Invalid role. Must be ADMIN, TREASURER or MEMBER'})
    try {
        //To - do
        // const updated = await prisma.groupMember.update({
        //     where: {
        //         userId_groupId: {userId, groupId}
        //     },
        //     data: {role}
        // })
        //res.json(updated)
        //Placeholder
        res.json({message: `Role ${role}  assigned to user ${userId} in group ${groupId}`})
    } catch (error) {
        res.status(500).json({error: 'Failed to assign role'})
    }
}
module.exports = {assignRole}