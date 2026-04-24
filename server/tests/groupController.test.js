// =========================
// 1. MOCKS
// =========================
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: { create: jest.fn() },
  meeting: {findMany: jest.fn() , findUnique :jest.fn()},
  groupMember: { findMany: jest.fn() , findUnique :jest.fn()},
  contribution: {findMany: jest.fn()}
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-invite-code'),
}));
jest.mock('../src/utils/inviteCode', () => ({
  generateUniqueInviteCode: jest.fn(() => 'test-code'),
}));
// =========================
// 2. IMPORTS
// =========================
const prisma = require('../lib/prisma');
const { addMinutes, createMeeting , getMeetings , getGroupById , getGroups,createGroup, joinGroup, getGroupSettings, updateGroupSettings, refreshInviteCode,getGroupContributions, updateContributionStatus } = require('../src/controllers/groupController');
const { generateUniqueInviteCode } = require('../src/utils/inviteCode');
const { getMemberContributions } = require('../controllers/contributionController')
// =========================
// 3. RESET
// =========================
beforeEach(() => {
  jest.clearAllMocks();
});
// =========================
// 5. TEST
// =========================

describe('getGroups', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("Given no user, then returns 401 Unauthorized", async () => {

    req = {};

    await getGroups(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("Given a logged in user, when getting their groups, then returns their groups", async () => {

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.groupMember.findMany.mockResolvedValue([
      {
        groupId: "group-1",
        group: { name: "Chess Club" },
        role: "MEMBER",
        joinedAt: new Date(),
      },
    ]);

    req = { user: { uid: "firebase-123" } };

    // WHEN
    await getGroups(req, res);

    // THEN
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseId: "firebase-123" },
    });
    expect(prisma.groupMember.findMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
describe('getMeetings', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("Given no user, then returns 401 Unauthorized", async () => {

    req = {
      params: { id: "group-1" },
      user: undefined,
    };

    await getMeetings(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("Given a logged in user but user not found in DB, then returns 404", async () => {

    req = {
      params: { id: "group-1" },
      user: { uid: "firebase-123" },
    };
    prisma.user.findUnique.mockResolvedValue(null);

    await getMeetings(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("Given a logged in user, when getting meetings, then returns meetings and role", async () => {
    req = {
      params: { id: "group-1" },
      user: { uid: "firebase-123" },
    };

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });

    prisma.meeting.findMany.mockResolvedValue([
      {
        id: "meeting-1",
        date: new Date("2026-01-01"),
        groupId: "group-1",
        User: { email: "host@test.com" },
      },
    ]);

    prisma.groupMember.findUnique.mockResolvedValue({ role: "ADMIN" });

    await getMeetings(req, res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseId: "firebase-123" },
      select: { id: true },
    });
    expect(prisma.meeting.findMany).toHaveBeenCalledWith({
      where: { groupId: "group-1" },
      orderBy: { date: "desc" },
      include: { User: { select: { email: true } } },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      meetings: [
        {
          id: "meeting-1",
          date: new Date("2026-01-01"),
          groupId: "group-1",
          User: { email: "host@test.com" },
        },
      ],
      role: "ADMIN",
    });
  });
});

describe('getMemberContributions', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'group-123' },
      user: { uid: 'firebase-uid-123' }
    }
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    }
    jest.clearAllMocks()
  })

  test('returns 404 if user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await getMemberContributions(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  test('returns 403 if user is not a member of the group', async () => {
  prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
  prisma.groupMember.findUnique.mockResolvedValue(null);

  await getMemberContributions(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({
    error: 'You are not a member of this group'
  });
});
  test('returns contributions for a valid member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' })
    prisma.groupMember.findUnique.mockResolvedValue({ id: 'member-123' })
    prisma.contribution.findMany.mockResolvedValue([
      {
        id: 'contrib-1',
        amount: 500,
        date: new Date('2026-01-01'),
        status: 'CONFIRMED',
        treasurer: { user: { email: 'treasurer@test.com' } },
        createdAt: new Date('2026-01-01')
      }
    ])

    await getMemberContributions(req, res)

    expect(res.json).toHaveBeenCalledWith({
      contributions: [
        {
          id: 'contrib-1',
          amount: 500,
          date: new Date('2026-01-01'),
          status: 'CONFIRMED',
          confirmedBy: 'treasurer@test.com',
          createdAt: new Date('2026-01-01')
        }
      ]
    })
  })

  test('returns 401 if no token is provided', async () => {
  req.user = null;

  await getMemberContributions(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({
    error: 'Unauthorized'
  });
});
})

describe("createGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given a logged-in user, when creating a group, then returns that group", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
    });

    prisma.group.create.mockResolvedValue({
      id: "group-1",
      name: "Chess Club",
      inviteCode: "test-code",
      inviteCodeExpiry: new Date(),
      members: [],
    });

    const req = {
      user: { uid: "firebase-123" },
      body: { name: "Chess Club" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createGroup(req, res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseId: "firebase-123" },
    });

    expect(prisma.group.create).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("Given no user when you attempt to create a group then you receive a 401 unauthorized", async () => {
    const req = {
      user: null,
      body: { name: "Chess Club" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });
});
