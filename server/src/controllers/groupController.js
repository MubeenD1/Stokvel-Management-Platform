const {PrimsaClient} = require('@prisma/client');
const prisma = new PrimsaClient();

//this will handle the logic for joining a group via the invite code 
async function joinGroup(req,res){
    const {inviteCode} = req.body;
    const firebaseId = req.user.uid;

    //this will verify that an invite code was sent 
    if (!inviteCode){
        return res.status(400).json({error:'Invite code is required'});

    }

    //this will find the user in the database using their firebase Id
    try{
        const user = await prisma.user.findUnique({
            where:{firebaseId},
        });

        if(!user){
            return res.status(404).json({error:'User not found'});
        }

        //this will find the group that matches the invite code sent 
        const group = await prisma.group.findUnique({
            where:{inviteCode},
        });

        //this accounts for when no groups are found meaning an invalid code
        if(!group){
            return res.status(404).json({error:'Invalid invite code'});
        }

        //this will check if the invite code that was sent has expired 
        if(group.inviteCodeExpiry && new Date() > group.inviteCodeExpiry){
            return res.status(400).json({error:'Invite code has expired'});
        }

        //this will check if the user is an existing member of the group
         const existingMember = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: group.id,
                },
            },
         });

         if(existingMember){
            return res.status(400).json({error:'You are already a member of this group'});
         }

         //if not, this will add the user to the group as a member
         await prisma.groupMember.create({
            data:{
                userId : user.id,
                groupId: group.Id,
                name: group.name,
            },
         });
    }catch(error){
        console.error('joinGroup error:, error');
        return res.status(500).json({error:'Internal server error'});
    }
}

module.exports = {joinGroup};