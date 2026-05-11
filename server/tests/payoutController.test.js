const { initiatePayout, getPayoutHistory, getEligibleMembers } = require('../controllers/payoutController');
const { PrismaClient } = require('@prisma/client');

// Mock database
jest.mock('@prisma/client', () => {
  const mPrisma = {
    payout: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(), // <-- Fixed to a colon!
    },
    groupMember: {
        findMany: jest.fn(),
    }
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('Payout Controller Test Suite', () => {
  let req, res;

  // Shared setup: runs before EVERY single test
  beforeEach(() => {
    req = { 
      body: { groupId: 'group-123', memberId: 'member-456', amount: 500 },
      params: { groupId: 'group-123' } // Added params here so the GET routes have it automatically!
    };
    res = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
    };
    jest.clearAllMocks(); 
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- INITIATE PAYOUT TESTS ---
  describe('initiatePayout', () => {
    it('should prevent duplicate payouts if member already has a SUCCESS status', async () => {
      prisma.payout.findFirst.mockResolvedValue({ id: 'existing-payout-id', status: 'SUCCESS' });

      await initiatePayout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/Payout already/i) 
      }));
      expect(prisma.payout.create).not.toHaveBeenCalled(); 
    });

    it('should successfully process a new payout', async () => {
      prisma.payout.findFirst.mockResolvedValue(null);
      prisma.payout.create.mockResolvedValue({ id: 'new-payout-id', status: 'PENDING' });
      prisma.payout.update.mockResolvedValue({ id: 'new-payout-id', status: 'SUCCESS', reference: 'PFBATCH_TEST' });
      jest.spyOn(Math, 'random').mockReturnValue(0.99);

      await initiatePayout(req, res);

      expect(prisma.payout.findFirst).toHaveBeenCalled();
      expect(prisma.payout.create).toHaveBeenCalled();
      expect(prisma.payout.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' })
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Payout successful'
      }));
    });

    it('should handle a failed PayFast transaction', async () => {
      prisma.payout.findFirst.mockResolvedValue(null);
      prisma.payout.create.mockResolvedValue({ id: 'fail-payout-id', status: 'PENDING' });
      prisma.payout.update.mockResolvedValue({ id: 'fail-payout-id', status: 'FAILED' });
      jest.spyOn(Math, 'random').mockReturnValue(0.01);

      await initiatePayout(req, res);

      expect(prisma.payout.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'FAILED' }
      }));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String) 
      }));
    });

    it('should catch database crashes and return a 500 error', async () => {
      prisma.payout.findFirst.mockRejectedValue(new Error('Neon Database connection lost'));

      await initiatePayout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  // --- GET HISTORY TESTS ---
  describe('getPayoutHistory', () => {
    it('should return a list of payout history', async () => {
      const mockHistory = [
        { id: '1', amount: 500, status: 'SUCCESS', member: { user: { email: 'test@test.com' } } }
      ];
      prisma.payout.findMany.mockResolvedValue(mockHistory);

      await getPayoutHistory(req, res);

      expect(prisma.payout.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { groupId: 'group-123' },
        orderBy: { createdAt: 'desc' }
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should handle errors when fetching history', async () => {
      prisma.payout.findMany.mockRejectedValue(new Error('Database dead'));

      await getPayoutHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch payout history' });
    });
  });

  // --- GET ELIGIBLE MEMBERS TESTS ---
  describe('getEligibleMembers', () => {
    it('should filter out members who already have a SUCCESS payout', async () => {
      const mockMembers = [
        { id: 'member-1', payouts: [] }, // Eligible
        { id: 'member-2', payouts: [{ status: 'SUCCESS' }] } // Not Eligible
      ];
      prisma.groupMember.findMany.mockResolvedValue(mockMembers);

      await getEligibleMembers(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 'member-1', payouts: [] }
      ]);
    });

    it('should handle errors when fetching eligible members', async () => {
      prisma.groupMember.findMany.mockRejectedValue(new Error('Crash'));

      await getEligibleMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch eligible members' });
    });
  });
});