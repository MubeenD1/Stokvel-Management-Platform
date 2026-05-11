//Mocks
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: { create: jest.fn() , findUnique : jest.fn()},
  meeting: {findMany: jest.fn() , findUnique :jest.fn() , create : jest.fn() , update : jest.fn()},
  groupMember: { findMany: jest.fn() , findUnique :jest.fn() , findFirst : jest.fn()},
  contribution: {findMany: jest.fn() , create: jest.fn(), update: jest.fn()}
}));


//Imports
const prisma = require('../lib/prisma')
const {updateContributionStatus} = require('../controllers/contributionController')


//Reest
beforeEach(() => {
    jest.clearAllMocks();
});

//Tests
describe('Update Contribution status', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {groupId: 'group-123', contributionId: 'cont-123'},
            body: {status: 'CONFIRMED'},
            user: {id: 'firebase-user-123'}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    test('should successfully update status for ADMIN and return result', async () => {
        prisma.groupMember.findFirst.mockResolvedValue({ id: 'admin-id', role: 'ADMIN' });
        
        const mockUpdatedResult = { id: 'cont-123', status: 'CONFIRMED' };
        prisma.contribution.update.mockResolvedValue(mockUpdatedResult);

        await updateContributionStatus(req, res);

        expect(prisma.contribution.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockUpdatedResult);
    });

    test('should successfully update status for TREASURER', async () => {
        prisma.groupMember.findFirst.mockResolvedValue({ id: 'treasurer-id', role: 'TREASURER' });
        
        const mockUpdatedResult = { id: 'cont-123', status: 'CONFIRMED' };
        prisma.contribution.update.mockResolvedValue(mockUpdatedResult);

        await updateContributionStatus(req, res);

        expect(prisma.contribution.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    test('should return 403 if requester is only a MEMBER', async () => {
    
    prisma.groupMember.findFirst.mockResolvedValue({ id: 'member-id', role: 'MEMBER' });

    await updateContributionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("Access Denied")
    });
    // Ensure update was never called
    expect(prisma.contribution.update).not.toHaveBeenCalled();
    });

    test('should return 400 for an invalid status string', async () => {
        req.body.status = 'NOT_A_VALID_STATUS';

        await updateContributionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid Status Update." });
    });

    test('should return 500 if database update fails', async () => {
        prisma.groupMember.findFirst.mockResolvedValue({ id: 'admin-id', role: 'ADMIN' });
        prisma.contribution.update.mockRejectedValue(new Error('Database crash'));

        // Suppress console.error for cleaner logs
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await updateContributionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to verify contribution." });
        
        consoleSpy.mockRestore();
    });
});

