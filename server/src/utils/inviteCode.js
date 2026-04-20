const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

//this will create a 6 char invite code
const CHARACTERS = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
const CODE_LENGTH = 6
async function generateUniqueInviteCode() {
    
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


module.exports = {
    generateUniqueInviteCode
};