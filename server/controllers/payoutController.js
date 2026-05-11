const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');


//Mimics payfast api call
const simulatePayFastPayout = async (amount, reference) => {
    return new Promise((resolve) => {
        console.log(`[Sandbox] Processing payout of R${amount} for ref ${reference}...`);
        //Mimic network delay
        setTimeout(() => {
            const onSuccess = Math.random() > 0.05;//95% success rate for testing
            resolve({
                success: onSuccess,
                batch_id: onSuccess ? `PFBATCH_${crypto.randomBytes(4).toString('hex')}` :  null,
                error: onSuccess ? null : "Insufficent sandbox funds/Invalid account details"
            });

        }, 2000);
    });
};

const initiatePayout = async (req, res) => {
    const {groupId, memberId, amount} = req.body;

    try {
        //Validation - if member already has succesful payout 
        const existingPayout = await prisma.payout.findFirst({
            where: {
                groupId, 
                memberId, 
                status: 'SUCCESS'
            }
        });

        if (existingPayout) {
            return res.status(400).json({ error: "Payout already proccessed."});
        }
        //Recording 'PENDING' transaction
        const payout = await prisma.payout.create({
            data: {
                groupId,
                memberId,
                amount: parseFloat(amount),
                status: 'PENDING',
            }
        });
        //Init sandbox payout
        const result = await simulatePayFastPayout(amount, payout.id);
        if (result.success) {
            const updatedPayout = await prisma.payout.update({
                where: { id: payout.id },
                data: {
                    status: 'SUCCESS',
                    reference: result.batch_id
                }
            });
            return res.status(200).json({message: 'Payout successful', payout: updatedPayout});
        } else {
            await prisma.payout.update({
                where: {id: payout.id},
                data: {status: 'FAILED'}
            });
            return res.status(400).json({error: result.error});
        }
    } catch (error) {
        console.error('Payout Error: ', error);
        res.status(500).json({ error: 'Internal server error'})
    }
};

const getPayoutHistory = async (req, res) => {
    const { groupId } = req.params;
    try {
        const history = await prisma.payout.findMany({
            where : {groupId}, 
            include: {
                member: {
                    include: {user: true}
                }
            },
            orderBy: {createdAt: 'desc'}
            
        });
        return res.status(200).json(history);
    } catch (error) {
        console.error('History Fetch Error: ', error);
        res.status(500).json({error: 'Failed to fetch payout history'});
    }
};

const getEligibleMembers = async (req, res) => {
    const { groupId } = req.params;
    console.log("Checking eligibility for Group Id:", groupId);
    try {
        const allMembers = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: true,
                payouts: {
                    where: { status: 'SUCCESS' }
                }
            }
        });
        console.log("Found members:", allMembers.length); // <-- Add this

        // Filter for members who have 0 successful payouts
        const eligible = allMembers.filter(member => member.payouts.length === 0);
        res.json(eligible);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch eligible members' });
    }
};

module.exports = { initiatePayout, getPayoutHistory, getEligibleMembers };