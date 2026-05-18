//Mocks
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: { create: jest.fn(), findUnique: jest.fn() },
  meeting: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  groupMember: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  contribution: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
}))

jest.mock('../controllers/contributionService', () => ({
  saveContribution: jest.fn(),
}));

jest.mock('../src/utils/sarbService', () => ({
  fetchLatestSarbRates: jest.fn(),
}));


//Imports
const prisma = require('../lib/prisma')
const {updateContributionStatus} = require('../controllers/contributionController')
const { saveContribution } = require('../controllers/contributionService');
const { fetchLatestSarbRates } = require('../src/utils/sarbService');
const { getMemberContributions, createContribution, getSavingsProjection } = require('../controllers/contributionController');

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

describe('getMemberContributions', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-uid-123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 401 if no user is provided', async () => {
    req.user = null;

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('returns 404 if user is not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 403 if user is not a member of the group', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue(null);

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not a member of this group' });
  });

  test('returns formatted contributions for a valid member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: 200 });
    prisma.contribution.findMany.mockResolvedValue([
      {
        id: 'contrib-1',
        amount: 500,
        date: new Date('2026-01-01'),
        status: 'CONFIRMED',
        treasurer: { user: { email: 'treasurer@test.com' } },
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'contrib-2',
        amount: 300,
        date: new Date('2026-02-01'),
        status: 'PENDING',
        treasurer: null,
        createdAt: new Date('2026-02-01'),
      },
    ]);

    await getMemberContributions(req, res);

    expect(res.json).toHaveBeenCalledWith({
      contributions: [
        {
          id: 'contrib-1',
          amount: 500,
          date: new Date('2026-01-01'),
          status: 'CONFIRMED',
          confirmedBy: 'treasurer@test.com',
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'contrib-2',
          amount: 300,
          date: new Date('2026-02-01'),
          status: 'PENDING',
          confirmedBy: null,
          createdAt: new Date('2026-02-01'),
        },
      ],
      groupMemberId: 'member-123',
      contributionAmount: 200,
    });
  });

  test('returns 500 if prisma throws', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('DB crash'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch contributions' });
    consoleSpy.mockRestore();
  });
});

describe('createContribution', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-uid-123' },
      body: { amount: 150 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 401 if no user is provided', async () => {
    req.user = null;

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('returns 404 if user is not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 403 if user is not a member of the group', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue(null);

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not a member of this group' });
  });

  test('returns 400 if amount is missing', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    req.body.amount = null;

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'A valid amount is required' });
  });

  test('returns 400 if amount is negative', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    req.body.amount = -50;

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'A valid amount is required' });
  });

  test('returns 400 if amount is zero', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    req.body.amount = 0;

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'A valid amount is required' });
  });

  test('creates a contribution and returns 201', async () => {
    const mockContribution = { id: 'contrib-1', amount: 150, status: 'PENDING' };

    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    saveContribution.mockResolvedValue(mockContribution);

    await createContribution(req, res);

    expect(saveContribution).toHaveBeenCalledWith({
      amount: 150,
      groupId: 'group-123',
      groupMemberId: 'member-123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockContribution);
  });

  test('returns 500 if saveContribution throws', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    saveContribution.mockRejectedValue(new Error('DB crash'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch contributions' });
    consoleSpy.mockRestore();
  });
});

describe('getSavingsProjection', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-uid-123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 401 if no user is provided', async () => {
    req.user = null;

    await getSavingsProjection(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('returns 404 if user is not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await getSavingsProjection(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 403 if user is not a member of the group', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue(null);

    await getSavingsProjection(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not a member of this group' });
  });

  test('returns correct projection for a valid member with contributions', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: 500 });
    prisma.contribution.findMany.mockResolvedValue([
      { amount: 500 },
      { amount: 500 },
    ]);
    fetchLatestSarbRates.mockResolvedValue({ repoRate: 8.25 });

    await getSavingsProjection(req, res);

    expect(fetchLatestSarbRates).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        totalContributions: 1000,
        monthlyContribution: 500,
        repoRate: 8.25,
        projectedSavings: expect.any(Number),
        projectionMonths: 12,
        basedOn: 'SARB Repo Rate',
      })
    );
  });

  test('handles a member with no confirmed contributions (zero total)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: 300 });
    prisma.contribution.findMany.mockResolvedValue([]);
    fetchLatestSarbRates.mockResolvedValue({ repoRate: 6.75 });

    await getSavingsProjection(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        totalContributions: 0,
        monthlyContribution: 300,
        repoRate: 6.75,
        projectedSavings: expect.any(Number),
      })
    );
  });

  test('falls back to 0 monthly contribution if group has no contributionAmount', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: null });
    prisma.contribution.findMany.mockResolvedValue([]);
    fetchLatestSarbRates.mockResolvedValue({ repoRate: 7.0 });

    await getSavingsProjection(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ monthlyContribution: 0 })
    );
  });

  test('returns 500 if fetchLatestSarbRates throws', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: 500 });
    prisma.contribution.findMany.mockResolvedValue([]);
    fetchLatestSarbRates.mockRejectedValue(new Error('SARB API down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getSavingsProjection(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to calculate savings projection' });
    consoleSpy.mockRestore();
  });

  test('returns 500 if prisma throws', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('DB crash'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getSavingsProjection(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to calculate savings projection' });
    consoleSpy.mockRestore();
  });
});



