const prisma = require('../lib/prisma');

async function saveContribution({ amount, groupId, groupMemberId, status = 'PENDING' }) {
  return await prisma.contribution.create({
    data: {
      amount: parseFloat(amount),
      date: new Date(),
      status,
      memberId: groupMemberId,
      groupId,
    },
    include: {
      member: {
        include: {
          user: true,       // gets email, name, etc.
        },
      },
      group: true,          // gets group name
    },
  });
}

module.exports = { saveContribution };