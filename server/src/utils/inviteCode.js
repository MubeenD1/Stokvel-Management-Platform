const { PrismaClient } = require('../../generated/prisma');
const crypto = require('crypto');
const prisma = new PrismaClient();

//this will create a 8 char invite code 

async function generateUniqueInviteCode() {
    const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const CODE_LENGTH = 8;

    let isUnique = false;
    let code = '';

    while(!isUnique){
        code = Array.from(crypto.randomBytes(CODE_LENGTH)).map((byte)=>CHARACTERS[byte % CHARACTERS.length]).join('');

        const existing = await prisma.group.findUnique({
            where : {inviteCode : code},

        });

        if(!existing){
            isUnique = true;

        }

    }

    return code;
}

//this will assign a new invite code to a group once it has been created 
async function assignInviteCodeToGroup(groupId, expiryDays = null){
    const inviteCode = await generateUniqueInviteCode();
    const inviteCodeExpiry = expiryDays
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : null;

    const updatedGroup = await prisma.group.update({
        where : {id:groupId},
        data : {
            inviteCode,
            inviteCodeExpiry,
        },

    });

    return{
        inviteCode: updatedGroup.inviteCode,
        inviteCodeExpiry: updatedGroup.inviteCodeExpiry,
    };


}

//this will regenerate an invite code for an existing group 
async function regenerateInviteCode(groupId, expiryDays = null){
    return assignInviteCodeToGroup(groupId, expiryDays);
}

module.exports = {
    generateUniqueInviteCode,
    assignInviteCodeToGroup,
    regenerateInviteCode,
};
