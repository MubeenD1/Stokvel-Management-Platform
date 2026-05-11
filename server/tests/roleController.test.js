//Mocks
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: { create: jest.fn() , findUnique : jest.fn()},
  meeting: {findMany: jest.fn() , findUnique :jest.fn() , create : jest.fn() , update : jest.fn()},
  groupMember: { findMany: jest.fn() , findUnique :jest.fn() , findFirst : jest.fn(), update: jest.fn()},
  contribution: {findMany: jest.fn() , create: jest.fn()},
  role: {findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn()}
}));

//Imports
const prisma = require('../lib/prisma')
const {assignRole} = require('../controllers/roleController')

//Reset
beforeEach(() => {
  jest.clearAllMocks();
});

//Tests
describe('assignRole', () => {
    let req, res;
    beforeEach(() => {
        req = {
        params: {groupId: 'group-123', userId: 'user-123'},
        body: {role: 'ADMIN'},
    };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
    });
    

    test('should successfully update role and return 200', async () => {
        const mockUpdatedMember = { id: 'user-123', role: 'ADMIN' };
        prisma.groupMember.update.mockResolvedValue(mockUpdatedMember);

        await assignRole(req, res);

        expect(prisma.groupMember.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'ADMIN' },
        });
        expect(res.json).toHaveBeenCalledWith(mockUpdatedMember);
    });

  test('should return 400 for an invalid role', async () => {
    req.body.role = 'SUPER_USER'; // Not in validRoles array

    await assignRole(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role' });
    // Ensure database wasn't even touched
    expect(prisma.groupMember.update).not.toHaveBeenCalled();
  });

  test('should return 500 if Prisma update fails', async () => {
    prisma.groupMember.update.mockRejectedValue(new Error('DB connection lost'));

    await assignRole(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to assign role' });
  });
});