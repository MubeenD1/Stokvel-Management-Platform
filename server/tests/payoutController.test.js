const { initiatePayout, getPayoutHistory, getEligibleMembers } = require('../controllers/payoutController');
const { PrismaClient } = require('@prisma/client');

// Mock database
jest.mock('@prisma/client', () => {
  const mPrisma = {
    payout: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(), 
      aggregate: jest.fn(),
    },
    groupMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
    }, 
    contribution: {
      aggregate: jest.fn(),
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
  // --- GET PAST PAYOUTS TESTS (Member Statement) ---
  describe('getPastPayouts', () => {
    // Add user info to req since this is a member-facing route
    beforeEach(() => {
      req.user = { uid: 'auth-uid-123', email: 'test@student.wits.ac.za' };
    });

    it('should successfully calculate net balances and return payout history', async () => {
      // 1. Mock finding the member profile
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
      
      // 2. Mock the total payouts received (e.g., R 5000)
      prisma.payout.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      
      // 3. Mock the total contributions made (e.g., R 1500)
      prisma.contribution.aggregate.mockResolvedValue({ _sum: { amount: 1500 } });
      
      // 4. Mock the explicit ledger rows
      const mockPastPayouts = [{ id: 'pay-1', amount: 5000, status: 'SUCCESS' }];
      prisma.payout.findMany.mockResolvedValue(mockPastPayouts);

      const { getPastPayouts } = require('../controllers/payoutController');
      await getPastPayouts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalReceived: 5000,
          payouts: mockPastPayouts
        }
      });
    });

    it('should fall back to 0 if aggregate sums return null (brand new member)', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
      prisma.payout.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.contribution.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.payout.findMany.mockResolvedValue([]);

      const { getPastPayouts } = require('../controllers/payoutController');
      await getPastPayouts(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalReceived: 0,
          payouts: []
        }
      });
    });

    it('should handle errors gracefully', async () => {
      prisma.groupMember.findUnique.mockRejectedValue(new Error('DB connection failed'));
      
      const { getPastPayouts } = require('../controllers/payoutController');
      await getPastPayouts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      //expect(res.json).toHaveBeenCalledWith(200);
    });
  });

  // --- GET UPCOMING PAYOUTS TESTS (Admin Projection) ---
  describe('getUpcomingPayouts', () => {
    it('should calculate pending liability and return a schedule for unpaid members', async () => {
      // Mock two members who haven't been paid yet
      const mockUnpaidMembers = [
        { id: 'mem-1', user: { email: 'alice@wits.ac.za' } },
        { id: 'mem-2', user: { email: 'bob@wits.ac.za' } }
      ];
      
      // Mock Prisma returning these members
      prisma.groupMember.findMany.mockResolvedValue(mockUnpaidMembers);

      // Assume the group contribution standard payout size is R2500 per member
      // The controller likely loops through unpaid members and builds a schedule array
      const { getUpcomingPayouts } = require('../controllers/payoutController');
      await getUpcomingPayouts(req, res);

      //expect(prisma.groupMember.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      
      // We expect the controller to return a data object with a total and schedule array
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          upcomingTotal: expect.any(Number),
          schedule: expect.any(Array)
        })
      }));
    });

    it('should return 0 liability if all members have been paid', async () => {
      // Return an empty array indicating no one is eligible for a pending payout
      prisma.groupMember.findMany.mockResolvedValue([]);

      const { getUpcomingPayouts } = require('../controllers/payoutController');
      await getUpcomingPayouts(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          upcomingTotal: 0,
          schedule: []
        }
      }));
    });

    it('should catch database errors when generating projections', async () => {
      prisma.groupMember.findMany.mockRejectedValue(new Error('Calculation Error'));

      const { getUpcomingPayouts } = require('../controllers/payoutController');
      await getUpcomingPayouts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      //expect(res.json).toHaveBeenCalledWith(200);
    });
  });
});