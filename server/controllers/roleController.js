const prisma = require("../lib/prisma")
//const prisma = new PrismaClient

const assignRole = async (req, res) => {
    // The route gives us 'userId', but we now know it's actually the GroupMember.id
    const { groupId, userId } = req.params; 
    const { role } = req.body;

    const validRoles = ['ADMIN', 'TREASURER', 'MEMBER'];
    if (!validRoles.includes(role)) return res.status(400).json({error: 'Invalid role'});

    try {
        // Bulletproof update using the primary key!
        const updated = await prisma.groupMember.update({
            where: {
                id: userId  // <-- THE MAGIC FIX: We search the 'id' column, not 'userId'
            },
            data: { role }
        });

        res.json(updated);
        
    } catch (error) {
        console.error('🔥 Prisma Error:', error);
        res.status(500).json({error: 'Failed to assign role'});
    }
}
module.exports = {assignRole}
