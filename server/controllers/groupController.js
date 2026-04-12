const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createGroup(req,res){
    try{
        const { uid, email } = req.user;

        const group = await prisma.group.create({
            data:{
                name,
                iniviteCode : uuidv4().slice(0, 8),
                memebers:{
                    create :{
                        uid,
                        role :"ADMIN",
                    },
                },
            },
            include:{ members :true,},
        });
        res.json(group)
    }catch(error){
          res.status(500).json({ error: "Failed to create group" });
    }
}

module.exports = { createGroup }