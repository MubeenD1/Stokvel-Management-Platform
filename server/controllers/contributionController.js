const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

async function getMemberContributions(req,res){
    try{
        const {groupId} = req.params
        const firebaseId = req.user.groupId

        //this will find the user in the database
        const user = await prisma.user.findUnique({
            where : {firebaseId}
        })

        if(!user){
            return res.status(404).json({error : 'User not found'})
        }

        //this will the record of the group member
        const contributions = await prisma.contribution.findMany({
            where : {
                memberId : groupMemberId
            },
            include: {
                treasurer : {
                    include : {
                        user : true
                    }
                }
            },
            orderBy : {
                date : 'desc'
            }
        })

        //this will format the response
        const format = contributions.map(c=> ({
            id : c.id,
            amount : c.amount,
            date : c.date,
            status : c.status,
            confirmedBy : c.treasurer ? c.treasurer.user.email : null,
            createdAt : c.createdAt
        }))

        res.json({contributions : format})

    } catch(err){
        console.error(err)
        res.status(500).json({error : 'Failed to fetch contribution'})
    }
}

module.exports = {getMemberContributions}