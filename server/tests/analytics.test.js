// =========================
// 1. MOCKS
// =========================
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  groupMember: { findUnique: jest.fn(), findMany: jest.fn() },
  contribution: { findMany: jest.fn() },
}));

jest.mock('../src/utils/analyticsService', () => ({
  getContributionData: jest.fn(),
  getPayoutData: jest.fn(),
}));

// =========================
// 2. IMPORTS
// =========================
const prisma = require('../lib/prisma');
const { getContributionData, getPayoutData } = require('../src/utils/analyticsService');
const {
  getContributionAnalytics,
  getPayoutAnalytics,
  getContributionCompliance,
} = require('../src/controllers/analyticsController');

// =========================
// 3. SETUP & CORESET
// =========================
describe('Analytics Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // =========================================================================
  // 4. getContributionAnalytics Suite
  // =========================================================================
  describe('getContributionAnalytics', () => {
    test('returns 400 if required parameters are missing', async () => {
      req = { query: { startDate: '2026-01-01', endDate: '2026-03-01' } }; // missing groupId

      await getContributionAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'startDate, endDate and groupId are required' });
    });

    test('returns 400 if date range exceeds 6 months', async () => {
      req = {
        query: {
          startDate: '2026-01-01',
          endDate: '2026-08-15', // Over 6 months gap
          groupId: 'group-123',
        },
      };

      await getContributionAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Date range cannot exceed 6 months' });
    });

    test('returns 400 if startDate is after endDate', async () => {
      req = {
        query: {
          startDate: '2026-06-01',
          endDate: '2026-01-01',
          groupId: 'group-123',
        },
      };

      await getContributionAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'startDate cannot be after endDate' });
    });

    test('successfully builds filter maps and passes it to getContributionData', async () => {
      req = {
        query: {
          startDate: '2026-01-01',
          endDate: '2026-05-01',
          groupId: 'group-123',
          memberId: 'mem-1,mem-2',
          statuses: 'PENDING,CONFIRMED',
        },
      };

      const mockResponse = { tableData: [], pieData: [], barData: [] };
      getContributionData.mockResolvedValue(mockResponse);

      await getContributionAnalytics(req, res);

      expect(getContributionData).toHaveBeenCalledWith({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-05-01'),
        groupId: 'group-123',
        memberId: ['mem-1', 'mem-2'],
        statuses: ['PENDING', 'CONFIRMED'],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    test('handles "all" keyword filters cleanly by passing null variants to underlying service', async () => {
      req = {
        query: {
          startDate: '2026-01-01',
          endDate: '2026-05-01',
          groupId: 'group-123',
          memberId: 'all',
          statuses: 'all',
        },
      };

      await getContributionAnalytics(req, res);

      expect(getContributionData).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: null,
          statuses: null,
        })
      );
    });

    test('returns 500 when getContributionData throws an internal exception', async () => {
      req = { query: { startDate: '2026-01-01', endDate: '2026-02-01', groupId: 'group-123' } };
      getContributionData.mockRejectedValue(new Error('DB connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await getContributionAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // 5. getPayoutAnalytics Suite
  // =========================================================================
  describe('getPayoutAnalytics', () => {
    test('successfully parses parameters and translates COMPLETED statuses into SUCCESS', async () => {
      req = {
        query: {
          startDate: '2026-01-01',
          endDate: '2026-04-01',
          groupId: 'group-123',
          memberId: 'all',
          statuses: 'pending,completed,failed',
        },
      };

      getPayoutData.mockResolvedValue({ processed: true });

      await getPayoutAnalytics(req, res);

      expect(getPayoutData).toHaveBeenCalledWith({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-01'),
        groupId: 'group-123',
        memberId: null,
        statuses: ['PENDING', 'SUCCESS', 'FAILED'], // UpperCased and mapped 'COMPLETED' to 'SUCCESS'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // =========================================================================
  // 6. getContributionCompliance Suite
  // =========================================================================
  describe('getContributionCompliance', () => {
    beforeEach(() => {
      req = {
        params: { groupId: 'group-123' },
        user: { uid: 'firebase-user-99' },
      };
    });

    test('returns 404 if calling user record does not exist in platform database', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await getContributionCompliance(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('returns 403 if target user is not a verified member of specific group', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-99' });
      prisma.groupMember.findUnique.mockResolvedValue(null); // No connection matching composite key

      await getContributionCompliance(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'You are not a member of this group' });
    });

    test('accurately builds unique months structure and outputs valid data metrics', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-99' });
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm-99', role: 'MEMBER' });

      // Group configuration layout containing 2 members
      const mockMembers = [
        { id: 'm-1', role: 'ADMIN', user: { email: 'admin@stokvel.com' } },
        { id: 'm-2', role: 'MEMBER', user: { email: 'member@stokvel.com' } },
      ];
      prisma.groupMember.findMany.mockResolvedValue(mockMembers);

      // Raw Contributions collected across different timeline intervals
      const mockContributions = [
        { memberId: 'm-1', amount: 500, status: 'CONFIRMED', date: '2026-01-10T10:00:00.000Z' },
        { memberId: 'm-1', amount: 500, status: 'CONFIRMED', date: '2026-02-12T10:00:00.000Z' },
        { memberId: 'm-2', amount: 500, status: 'PENDING', date: '2026-01-15T10:00:00.000Z' },
        // member 2 completely missed Feb 2026
      ];
      prisma.contribution.findMany.mockResolvedValue(mockContributions);

      await getContributionCompliance(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        months: ['2026-01', '2026-02'], // Distinct months parsed and sorted chronologically
        groupId: 'group-123',
        complianceData: [
          {
            memberId: 'm-1',
            email: 'admin@stokvel.com',
            role: 'ADMIN',
            complianceRate: 100, // 2 out of 2 months CONFIRMED
            totalContributed: 1000,
            monthlyStatus: [
              { month: '2026-01', status: 'CONFIRMED', amount: 500 },
              { month: '2026-02', status: 'CONFIRMED', amount: 500 },
            ],
          },
          {
            memberId: 'm-2',
            email: 'member@stokvel.com',
            role: 'MEMBER',
            complianceRate: 0, // 0 confirmed (one pending, one missed completely)
            totalContributed: 0,
            monthlyStatus: [
              { month: '2026-01', status: 'PENDING', amount: 500 },
              { month: '2026-02', status: 'MISSED', amount: 0 }, // Gracefully processed fallback state
            ],
          },
        ],
      });
    });

    test('handles empty contribution matrix safely without encountering divide-by-zero crashes', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u-99' });
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm-99' });
      prisma.groupMember.findMany.mockResolvedValue([{ id: 'm-1', role: 'MEMBER', user: { email: 'test@test.com' } }]);
      prisma.contribution.findMany.mockResolvedValue([]); // Empty history record

      await getContributionCompliance(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          months: [],
          complianceData: [
            expect.objectContaining({
              complianceRate: 0, // Handled division fallbacks perfectly
              totalContributed: 0,
            }),
          ],
        })
      );
    });
  });
});