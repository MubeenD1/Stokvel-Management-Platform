// =========================
// MOCKS
// =========================
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  meeting: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  groupMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  contribution: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-invite-code'),
}));

jest.mock('../src/utils/inviteCode', () => ({
  generateUniqueInviteCode: jest.fn(() => 'test-code'),
}));

// =========================
// IMPORTS
// =========================
const prisma = require('../lib/prisma');

const {
  addMinutes,
  createMeeting,
  getMeetings,
  getGroupById,
  getGroups,
  createGroup,
  joinGroup,
  getGroupSettings,
  updateGroupSettings,
} = require('../src/controllers/groupController');

const {
  getMemberContributions,
  createContribution,
} = require('../controllers/contributionController');

// =========================
// RESET
// =========================
beforeEach(() => {
  jest.clearAllMocks();
});


// =====================================================
// CONTRIBUTIONS
// =====================================================

describe('getMemberContributions', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'group-123' },
      user: { uid: 'firebase-uid-123' },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test('returns 404 if user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 if not group member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.groupMember.findUnique.mockResolvedValue(null);

    await getMemberContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns contributions successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-1' });
    prisma.group.findUnique.mockResolvedValue({ contributionAmount: 200 });

    prisma.contribution.findMany.mockResolvedValue([
      {
        id: 'c1',
        amount: 500,
        status: 'CONFIRMED',
        createdAt: new Date(),
        treasurer: { user: { email: 't@test.com' } },
      },
    ]);

    await getMemberContributions(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});


// =====================================================
// CREATE CONTRIBUTION
// =====================================================

describe('createContribution', () => {
  test('401 if unauthenticated', async () => {
    const req = { user: null, params: {}, body: { amount: 100 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('400 invalid amount', async () => {
    const req = {
      user: { uid: 'firebase' },
      params: { groupId: 'g1' },
      body: { amount: -1 },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('creates contribution', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'm1' });

    prisma.contribution.create.mockResolvedValue({
      id: 'c1',
      amount: 100,
    });

    const req = {
      user: { uid: 'firebase' },
      params: { groupId: 'g1' },
      body: { amount: 100 },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});


// =====================================================
// CREATE GROUP
// =====================================================

describe('createGroup', () => {
  test('401 if no user', async () => {
    const req = { user: null, body: { name: 'test' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('creates group', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    prisma.group.create.mockResolvedValue({
      id: 'g1',
      name: 'Chess Club',
    });

    const req = {
      user: { uid: 'firebase-1' },
      body: { name: 'Chess Club' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});


// =====================================================
// GET MEETINGS
// =====================================================

describe('getMeetings', () => {
  test('401 no user', async () => {
    const req = { user: null, params: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getMeetings(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns meetings', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    prisma.meeting.findMany.mockResolvedValue([
      { id: 'm1', date: new Date() },
    ]);

    prisma.groupMember.findUnique.mockResolvedValue({ role: 'ADMIN' });

    const req = {
      user: { uid: 'firebase' },
      params: { id: 'g1' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getMeetings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});


// =====================================================
// GET GROUP SETTINGS
// =====================================================

describe('getGroupSettings', () => {
  test('401 unauthorized', async () => {
    const req = { user: null, params: { id: 'g1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('400 missing group id', async () => {
    const req = { user: { uid: 'firebase' }, params: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns settings', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    prisma.group.findUnique.mockResolvedValue({
      id: 'g1',
      name: 'Test Group',
    });

    prisma.groupMember.findFirst.mockResolvedValue({ role: 'ADMIN' });

    const req = {
      user: { uid: 'firebase' },
      params: { id: 'g1' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});


// =====================================================
// UPDATE GROUP SETTINGS
// =====================================================

describe('updateGroupSettings', () => {
  test('401 unauthorized', async () => {
    const req = {
      user: null,
      params: { id: 'g1' },
      body: { name: 'new' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('403 not admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.groupMember.findFirst.mockResolvedValue({ role: 'MEMBER' });

    const req = {
      user: { uid: 'firebase' },
      params: { id: 'g1' },
      body: { name: 'new' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('updates group settings', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.groupMember.findFirst.mockResolvedValue({ role: 'ADMIN' });

    prisma.group.update.mockResolvedValue({
      id: 'g1',
      name: 'updated',
    });

    const req = {
      user: { uid: 'firebase' },
      params: { id: 'g1' },
      body: { name: 'updated' },
    };

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateGroupSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});