// =========================
// 1. MOCKS
// =========================
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  group: { create: jest.fn() , findUnique : jest.fn(),  update: jest.fn()},
  meeting: {findMany: jest.fn() , findUnique :jest.fn() , create : jest.fn() , update : jest.fn()},
  groupMember: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  contribution: {findMany: jest.fn() , create: jest.fn()}
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
const { getMemberContributions, createContribution } = require('../controllers/contributionController')
// =========================
// 3. RESET
// =========================
beforeEach(() => {
  jest.clearAllMocks();
});
// =========================
// 5. TEST
// =========================

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
    ],
    groupMemberId: 'member-123',   
    contributionAmount: 200,    
  });
});

  test('returns 401 if no token is provided', async () => {
  req.user = null;

  await getMemberContributions(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({
    error: 'Unauthorized'
  });
});
});
describe("createContribution", () => {
  
  it("should return 401 if user is not authenticated", async () => {
    const req = {
      user: null,
      params: { groupId: "group-123" },
      body: { amount: 150 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("should return 400 if amount is invalid", async () => {
    const req = {
      user: { uid: "firebase-uid-123" },
      params: { groupId: "group-123" },
      body: { amount: -50 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await createContribution(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "A valid amount is required" });
  });

  it("should create a contribution and return 201", async () => {
    const req = {
      user: { uid: "firebase-uid-123" },
      params: { groupId: "group-123" },
      body: { amount: 150 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    prisma.user.findUnique.mockResolvedValue({ id: "user-123" });
    prisma.groupMember.findUnique.mockResolvedValue({ id: "member-123" });
    prisma.contribution.create.mockResolvedValue({
      id: "contribution-123",
      amount: 150,
      date: new Date(),
      status: "PENDING",
      memberId: "member-123",
      groupId: "group-123",
    });

    await createContribution(req, res);

    expect(prisma.contribution.create).toHaveBeenCalledWith({
      data: {
        amount: 150,
        date: expect.any(Date),
        status: "PENDING",
        memberId: "member-123",
        groupId: "group-123",
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "contribution-123" }));
  });

});
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
  });    prisma.group.findUnique.mockResolvedValu
});
describe("addMinutes", () => {
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

    await addMinutes(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("Given no group Id, then returns 400", async() => {
     prisma.user.findUnique.mockResolvedValue({id: "user-1",});


     req = {
      user:{ uid: "firebase-123" 
      },
      params : {
          id : null,
          meetingId :'meeting id-3'
      },
      body : { minutes : "meeting number 3 for example"},
    }

    await addMinutes(req,res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: 'Group ID is required'})
  });

  test("Given a MEMBER user, when they try to add minutes, then they get 403", async () => {
  prisma.user.findUnique.mockResolvedValue({
    id: "user-1",
  });

  prisma.groupMember.findUnique.mockResolvedValue({
    groupId: "group-id-1",
    role: "MEMBER",
  });

  req = {
    user: { uid: "firebase-123", id: "user-1" },
    params: {
      id: "group-id-1",
      meetingId: "meeting-id-3",
    },
    body: {
      minutes: "The test minutes should not be added as this is a member",
    },
  };

  await addMinutes(req, res);

  expect(prisma.user.findUnique).toHaveBeenCalledWith({
    where: { firebaseId: "firebase-123" },
  });

  expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
    where: {
      userId_groupId: {
        userId: req.user.id,
        groupId: req.params.id,
      },
    },
  });

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({
    error: "Not authorized to create add meeting minutes",
  });
  });

  test("Given an ADMIN or TREASURER ,  when they try to add minutes . they get a succesfull message", async () =>{
  prisma.user.findUnique.mockResolvedValue({
    id: "user-1",
  });

  prisma.groupMember.findUnique.mockResolvedValue({
    groupId: "group-id-1",
    role: "ADMIN",
  });

  prisma.meeting.create.mockResolvedValue({
    id : "meeting-id-3",
    date : new Date(),
    location : "example fugayzi lo",
    agenda : "fugayzi agenda"
  })

  const meeting = {
    id: "meeting-id-3",
    minutes: "The test minutes were added successfully",
  };

prisma.meeting.update.mockResolvedValue(meeting);


  req = {
    user: { uid: "firebase-123", id: "user-1" },
    params: {
      id: "group-id-1",
      meetingId: "meeting-id-3",
    },
    body: {
      minutes: "The test minutes should be added succesfully",
    },
  };

  await addMinutes(req, res);

  expect(prisma.user.findUnique).toHaveBeenCalledWith({
    where: { firebaseId: "firebase-123" },
  });

  expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
    where: {
      userId_groupId: {
        userId: req.user.id,
        groupId: req.params.id,
      },
    },
  });

  expect(prisma.meeting.update).toHaveBeenCalledWith({
    where : {id : req.params.meetingId },
    data : { minutes : req.body.minutes },
  })

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({
    message: "successful",
    meeting,
  });
  
  })

});
describe('getGroupsById' ,() => {
let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });


  test('Given no user , when they try to open a group they get a 403 forbidden ' , async () =>{


    req = {};

    await getGroupById(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });

  });

  test("Given no group Id, then returns 400", async() => {
     prisma.user.findUnique.mockResolvedValue({id: "user-1",});


     req = {
      user:{ uid: "firebase-123" , id: "user-1"
      },
      params : {
          id : null,
      }
    }

    await getGroupById(req,res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: 'Group ID is required'})
  });

  test("Given a logged in user, when they enter their group, it returns their group, their role and the members and a 200 res code", async () => {

    const mockGroup = { id: "group-123", name: "Test Group" };
    const mockGroupMembers = [
        {
            userId: "user-1",
            groupId: "group-123",
            user: {
                email: "member@test.com",
                firebaseId: "firebase-member-1",
            },
        },
    ];
    const mockUser = { id: "user-1", firebaseId: "firebase-uid-123" };
    const mockMembership = { groupId: "group-123", userId: "user-1", role: "ADMIN" };

    prisma.group.findUnique.mockResolvedValue(mockGroup);
    prisma.groupMember.findMany.mockResolvedValue(mockGroupMembers);
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.groupMember.findFirst.mockResolvedValue(mockMembership);

    const req = {
        user: { uid: "firebase-uid-123" },
        params: { id: "group-123" },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };


    await getGroupById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        group: mockGroup,
        groupMembers: mockGroupMembers,
        role: mockMembership.role,
    });
  });



});

// ─────────────────────────────────────────────
// createMeeting
// ─────────────────────────────────────────────
describe('createMeeting', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 400 if group ID is missing', async () => {
    req = { params: { id: null }, user: { uid: 'firebase123' }, body: {} };

    await createMeeting(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Group ID is required' });
  });

  test('returns 403 if user is not ADMIN or TREASURER', async () => {
    req = {
      params: { id: 'group1' },
      user: { uid: 'firebase123' },
      body: { rDate: '2025-01-01', rLocation: 'HQ', rAgenda: 'Budget review' },
    };

    prisma.user.findUnique.mockResolvedValue({ id: 'user1', firebaseId: 'firebase123' });
    prisma.groupMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await createMeeting(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to create meetings' });
  });

  test('returns 201 and meeting data on successful creation', async () => {
    req = {
      params: { id: 'group1' },
      user: { uid: 'firebase123' },
      body: { rDate: '2025-06-01', rLocation: 'Office', rAgenda: 'Q2 Planning' },
    };

    const mockMeeting = {
      id: 'meeting1',
      groupId: 'group1',
      date: new Date('2025-06-01'),
      location: 'Office',
      agenda: 'Q2 Planning',
      createdById: 'user1',
      Group: { id: 'group1', name: 'Dev Team' },
      User: { id: 'user1', name: 'Alice' },
    };

    prisma.user.findUnique.mockResolvedValue({ id: 'user1', firebaseId: 'firebase123' });
    prisma.groupMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prisma.meeting.create.mockResolvedValue(mockMeeting);

    await createMeeting(req, res);

    expect(prisma.meeting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ groupId: 'group1', location: 'Office' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Meeting Created Successfully',
      meeting: mockMeeting,
    });
  });
});

describe('joinGroup', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 400 if invite code is missing', async () => {
    req = { body: {}, user: { uid: 'firebase123' } };

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invite code is required' });
  });

  test('returns 404 if invite code does not match any group', async () => {
    req = { body: { inviteCode: 'BADCODE' }, user: { uid: 'firebase123' } };

    prisma.user.findUnique.mockResolvedValue({ id: 'user1' });
    prisma.group.findUnique.mockResolvedValue(null);

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid invite code' });
  });

  test('returns 400 if user is already a member', async () => {
    req = { body: { inviteCode: 'VALID123' }, user: { uid: 'firebase123' } };

    prisma.user.findUnique.mockResolvedValue({ id: 'user1' });
    prisma.group.findUnique.mockResolvedValue({
      id: 'group1',
      name: 'Dev Team',
      inviteCode: 'VALID123',
      inviteCodeExpiry: null,
    });
    prisma.groupMember.findUnique.mockResolvedValue({ userId: 'user1', groupId: 'group1' });

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'You are already a member of this group' });
  });

  test('returns 200 and group info on successful join', async () => {
    req = { body: { inviteCode: 'VALID123' }, user: { uid: 'firebase123' } };

    prisma.user.findUnique.mockResolvedValue({ id: 'user1' });
    prisma.group.findUnique.mockResolvedValue({
      id: 'group1',
      name: 'Dev Team',
      inviteCode: 'VALID123',
      inviteCodeExpiry: null,
    });
    prisma.groupMember.findUnique.mockResolvedValue(null);
    // groupMember.create is not in your mock — add it to the top-level jest.mock:
    prisma.groupMember.create = jest.fn().mockResolvedValue({});

    await joinGroup(req, res);

    expect(prisma.groupMember.create).toHaveBeenCalledWith({
      data: { userId: 'user1', groupId: 'group1', role: 'MEMBER' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully joined group',
      group: { id: 'group1', name: 'Dev Team' },
    });
  });


  
});

describe('getGroupContributions', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns contributions for a valid group', async () => {
    req = { params: { groupId: 'group-123' } };

    const mockContributions = [
      {
        id: 'contrib-1',
        amount: 500,
        date: new Date('2026-01-01'),
        status: 'CONFIRMED',
        groupId: 'group-123',
        member: { user: { email: 'member@test.com' } },
        treasurer: { user: { email: 'treasurer@test.com' } },
      },
    ];

    prisma.contribution.findMany.mockResolvedValue(mockContributions);

    await getGroupContributions(req, res);

    expect(prisma.contribution.findMany).toHaveBeenCalledWith({
      where: { groupId: 'group-123' },
      include: {
        member: { include: { user: true } },
        treasurer: { include: { user: true } },
      },
      orderBy: { date: 'asc' },
    });
    expect(res.json).toHaveBeenCalledWith(mockContributions);
  });

  test('returns empty array when group has no contributions', async () => {
    req = { params: { groupId: 'group-empty' } };

    prisma.contribution.findMany.mockResolvedValue([]);

    await getGroupContributions(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns 500 if prisma throws an error', async () => {
    req = { params: { groupId: 'group-123' } };

    prisma.contribution.findMany.mockRejectedValue(new Error('DB crash'));

    await getGroupContributions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to load group contributions.' });
  });
});

describe('refreshInviteCode', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 403 if user is not an ADMIN of the group', async () => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-member' },
    };

    prisma.group.findUnique.mockResolvedValue({
      id: 'group-123',
      members: [
        { role: 'MEMBER', user: { firebaseId: 'firebase-member' } },
      ],
    });

    await refreshInviteCode(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only admins can do this' });
  });

  test('returns new invite code and expiry for ADMIN user', async () => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-admin' },
    };

    prisma.group.findUnique.mockResolvedValue({
      id: 'group-123',
      members: [
        { role: 'ADMIN', user: { firebaseId: 'firebase-admin' } },
      ],
    });

    generateUniqueInviteCode.mockResolvedValue('new-invite-code');

    const mockExpiry = new Date();
    prisma.group.update = jest.fn().mockResolvedValue({
      inviteCode: 'new-invite-code',
      inviteCodeExpiry: mockExpiry,
    });

    await refreshInviteCode(req, res);

    expect(generateUniqueInviteCode).toHaveBeenCalled();
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: 'group-123' },
      data: {
        inviteCode: 'new-invite-code',
        inviteCodeExpiry: expect.any(Date),
      },
    });
    expect(res.json).toHaveBeenCalledWith({
      inviteCode: 'new-invite-code',
      expiresAt: mockExpiry,
    });
  });

  test('returns 500 if prisma throws an error', async () => {
    req = {
      params: { groupId: 'group-123' },
      user: { uid: 'firebase-admin' },
    };

    prisma.group.findUnique.mockRejectedValue(new Error('DB crash'));

    await refreshInviteCode(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to refresh code' });
  });
});

describe('getNotifications', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('returns 404 if user is not found', async () => {
    req = { user: { uid: 'firebase-123' } };

    prisma.user.findUnique.mockResolvedValue(null);

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns notifications for a valid user', async () => {
    req = { user: { uid: 'firebase-123' } };

    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    const mockNotifications = [
      {
        id: 'notif-1',
        recipientId: 'user-1',
        sentAt: new Date('2026-01-01'),
        meeting: {
          id: 'meeting-1',
          Group: { id: 'group-1', name: 'Dev Team' },
        },
      },
    ];

    // add to your top-level mock: notification: { findMany: jest.fn() }
    prisma.notification = { findMany: jest.fn().mockResolvedValue(mockNotifications) };

    await getNotifications(req, res);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { recipientId: 'user-1' },
      orderBy: { sentAt: 'desc' },
      include: {
        meeting: {
          include: { Group: true },
        },
      },
    });
    expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
  });

  test('returns 500 if prisma throws an error', async () => {
    req = { user: { uid: 'firebase-123' } };

    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.notification = { findMany: jest.fn().mockRejectedValue(new Error('DB crash')) };

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch notifications' });
  });
});
