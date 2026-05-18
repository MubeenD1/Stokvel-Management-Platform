// =========================
// 1. MOCKS
// =========================

// ── Prisma ──────────────────────────────────────────────
// Fixed path here to match your root level 'lib' folder
jest.mock('../lib/prisma', () => ({
  sarbRate: { findFirst: jest.fn(), create: jest.fn() },
  group: { findUnique: jest.fn() },
  contribution: { findMany: jest.fn() },
  payout: { findMany: jest.fn() },
}));

// ── Axios ───────────────────────────────────────────────
jest.mock('axios');

// ── NodeCache ───────────────────────────────────────────
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: mockCacheGet,
    set: mockCacheSet,
  }));
});

// ── Nodemailer ──────────────────────────────────────────
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

// =========================
// 2. IMPORTS
// =========================
const prisma = require('../lib/prisma');
const axios = require('axios');

// FIX: Verified paths to map from your 'tests' folder, into 'src'
const { fetchLatestSarbRates } = require('../src/utils/sarbService'); // Note: Your file tree image shows this as sarbService.js inside src/utils
const { sendMeetingNotification, sendMinutesNotification, sendContributionEmail } = require('../src/utils/notificationService');
const { generateUniqueInviteCode } = require('../src/utils/inviteCode');
const { getContributionData, getPayoutData } = require('../src/utils/analyticsService'); // Note: Your file tree image shows this as analyticsService.js inside src/utils

// =========================
// 3. RESET
// =========================
beforeEach(() => {
  jest.clearAllMocks();
  
  // mockClear() resets the call counters and history, 
  // but safely preserves the .mockReturnValue(null) behavior!
  mockCacheGet.mockClear(); 
  mockCacheSet.mockClear();
  
  mockCacheGet.mockReturnValue(null); // Explicitly defaults to a cache miss
});

// =========================
// 4. fetchLatestSarbRates
// =========================
describe('fetchLatestSarbRates', () => {

  test('returns cached rates if cache hit', async () => {
    const cached = { repoRate: 8.25, primeRate: 11.75, source: 'Cache' };
    mockCacheGet.mockReturnValue(cached);

    const result = await fetchLatestSarbRates();

    expect(result).toEqual(cached);
    expect(axios.get).not.toHaveBeenCalled();
    expect(prisma.sarbRate.create).not.toHaveBeenCalled();
  });

  test('fetches from Trading Economics, saves to DB and cache on success', async () => {
    axios.get.mockResolvedValue({ data: [{ last: '8.25' }] });
    prisma.sarbRate.create.mockResolvedValue({});

    const result = await fetchLatestSarbRates();

    expect(result.repoRate).toBe(8.25);
    expect(result.primeRate).toBe(8.25 + 3.5);
    expect(result.source).toBe('Trading Economics');
    expect(prisma.sarbRate.create).toHaveBeenCalledWith({
      data: {
        repoRate: 8.25,
        primeRate: 11.75,
        source: 'Trading Economics',
      },
    });
    expect(mockCacheSet).toHaveBeenCalled();
  });

  test('falls back to DB rate when API call fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    const mockDbRate = {
      repoRate: 7.5,
      primeRate: 11.0,
      fetchedAt: new Date('2026-01-01'),
      source: 'Trading Economics',
    };
    prisma.sarbRate.findFirst.mockResolvedValue(mockDbRate);

    const result = await fetchLatestSarbRates();

    expect(result.repoRate).toBe(7.5);
    expect(result.primeRate).toBe(11.0);
    expect(result.fromCache).toBe(true);
    expect(prisma.sarbRate.create).not.toHaveBeenCalled();
    expect(mockCacheSet).toHaveBeenCalled();
  });

  test('uses hardcoded fallback 6.75 if API fails and no DB record exists', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    prisma.sarbRate.findFirst.mockResolvedValue(null);
    prisma.sarbRate.create.mockResolvedValue({});

    const result = await fetchLatestSarbRates();

    expect(result.repoRate).toBe(6.75);
    expect(result.primeRate).toBe(6.75 + 3.5);
    expect(result.source).toBe('Fallback Rate');
    expect(prisma.sarbRate.create).toHaveBeenCalled();
  });

  test('uses hardcoded fallback if API returns empty array and no DB record', async () => {
    axios.get.mockResolvedValue({ data: [] });
    prisma.sarbRate.findFirst.mockResolvedValue(null);
    prisma.sarbRate.create.mockResolvedValue({});

    const result = await fetchLatestSarbRates();

    expect(result.repoRate).toBe(6.75);
    expect(result.source).toBe('Fallback Rate');
  });
});

// =========================
// 5. notificationService
// =========================
describe('sendMeetingNotification', () => {

  test('sends an update email with correct subject and body', async () => {
    await sendMeetingNotification(
      ['member@test.com'],
      'Chess Club',
      { date: '2026-06-01', frequency: 'Monthly' },
      'update'
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['member@test.com'],
        subject: 'Meeting Update: Chess Club',
        text: expect.stringContaining('Chess Club'),
      })
    );
  });

  test('sends a schedule email when type is not "update"', async () => {
    await sendMeetingNotification(
      ['member@test.com'],
      'Chess Club',
      { date: '2026-06-01', frequency: 'Monthly' },
      'schedule'
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'New Meeting Scheduled: Chess Club',
      })
    );
  });

  test('defaults to "update" type when no type argument is passed', async () => {
    await sendMeetingNotification(['a@b.com'], 'Group', { date: '2026-01-01', frequency: 'Weekly' });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Meeting Update: Group',
      })
    );
  });

  test('includes meeting date and frequency in the email body', async () => {
    await sendMeetingNotification(
      ['a@b.com'],
      'Book Club',
      { date: '2026-07-15', frequency: 'Weekly' },
      'update'
    );

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.text).toContain('2026-07-15');
    expect(callArg.text).toContain('Weekly');
  });
});

describe('sendMinutesNotification', () => {

  test('sends minutes email with correct subject', async () => {
    await sendMinutesNotification(
      ['member@test.com'],
      'Chess Club',
      { date: 'Mon Jan 01 2026', minutes: 'We discussed the budget.' }
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Meeting Minutes Available: Chess Club',
        to: ['member@test.com'],
      })
    );
  });

  test('includes minutes content in the email body', async () => {
    await sendMinutesNotification(
      ['a@b.com'],
      'Chess Club',
      { date: 'Mon Jan 01 2026', minutes: 'Agenda item 1 discussed.' }
    );

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.text).toContain('Agenda item 1 discussed.');
    expect(callArg.text).toContain('Mon Jan 01 2026');
  });
});

describe('sendContributionEmail', () => {

  test('sends a contribution confirmation email', async () => {
    await sendContributionEmail({
      toEmail: 'user@test.com',
      name: 'Alice',
      amount: 500,
      groupName: 'Chess Club',
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: '✅ Contribution Received',
      })
    );
  });

  test('includes the amount and group name in the HTML body', async () => {
    await sendContributionEmail({
      toEmail: 'user@test.com',
      name: 'Alice',
      amount: 750,
      groupName: 'Stokvel A',
    });

    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.html).toContain('R750');
    expect(callArg.html).toContain('Stokvel A');
    expect(callArg.html).toContain('Alice');
  });
});

// =========================
// 6. generateUniqueInviteCode
// =========================
describe('generateUniqueInviteCode', () => {

  test('returns a 6-character alphanumeric code', async () => {
    prisma.group.findUnique.mockResolvedValue(null); // first attempt is unique

    const code = await generateUniqueInviteCode();

    expect(typeof code).toBe('string');
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test('retries if the first code already exists, returns a unique one', async () => {
    // First call: code taken; second call: unique
    prisma.group.findUnique
      .mockResolvedValueOnce({ id: 'existing-group' })
      .mockResolvedValueOnce(null);

    const code = await generateUniqueInviteCode();

    expect(prisma.group.findUnique).toHaveBeenCalledTimes(2);
    expect(code).toHaveLength(6);
  });

  test('keeps retrying until a unique code is found', async () => {
    prisma.group.findUnique
      .mockResolvedValueOnce({ id: 'g1' })
      .mockResolvedValueOnce({ id: 'g2' })
      .mockResolvedValueOnce({ id: 'g3' })
      .mockResolvedValueOnce(null);

    const code = await generateUniqueInviteCode();

    expect(prisma.group.findUnique).toHaveBeenCalledTimes(4);
    expect(code).toHaveLength(6);
  });
});

// =========================
// 7. analyticsService
// =========================
describe('getContributionData', () => {
  const baseFilters = {
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    memberId: null,
    statuses: null,
    groupId: 'group-123',
  };

  const mockContributions = [
    {
      id: 'c1',
      amount: 500,
      date: new Date('2026-01-15'),
      status: 'CONFIRMED',
      member: { user: { email: 'alice@test.com' } },
      treasurer: { user: { email: 'treasurer@test.com' } },
    },
    {
      id: 'c2',
      amount: 300,
      date: new Date('2026-01-20'),
      status: 'PENDING',
      member: { user: { email: 'bob@test.com' } },
      treasurer: null,
    },
  ];

  test('returns correctly shaped tableData', async () => {
    prisma.contribution.findMany.mockResolvedValue(mockContributions);

    const result = await getContributionData(baseFilters);

    expect(result.tableData).toEqual([
      {
        id: 'c1',
        email: 'alice@test.com',
        amount: 500,
        contributionDate: mockContributions[0].date,
        confirmedBy: 'treasurer@test.com',
        status: 'CONFIRMED',
      },
      {
        id: 'c2',
        email: 'bob@test.com',
        amount: 300,
        contributionDate: mockContributions[1].date,
        confirmedBy: null,
        status: 'PENDING',
      },
    ]);
  });

  test('returns correctly shaped pieData with status counts', async () => {
    prisma.contribution.findMany.mockResolvedValue(mockContributions);

    const result = await getContributionData(baseFilters);

    expect(result.pieData).toEqual(
      expect.arrayContaining([
        { status: 'CONFIRMED', count: 1 },
        { status: 'PENDING', count: 1 },
      ])
    );
  });

  test('returns barData grouped by month', async () => {
    prisma.contribution.findMany.mockResolvedValue(mockContributions);

    const result = await getContributionData(baseFilters);

    // Both contributions are in January 2026
    expect(result.barData).toHaveLength(1);
    expect(result.barData[0]).toMatchObject({
      CONFIRMED: 500,
      PENDING: 300,
    });
  });

  test('returns empty arrays when no contributions match', async () => {
    prisma.contribution.findMany.mockResolvedValue([]);

    const result = await getContributionData(baseFilters);

    expect(result.tableData).toEqual([]);
    expect(result.pieData).toEqual([]);
    expect(result.barData).toEqual([]);
  });

  test('applies memberId filter when provided', async () => {
    prisma.contribution.findMany.mockResolvedValue([]);

    await getContributionData({ ...baseFilters, memberId: 'member-1' });

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberId: { in: ['member-1'] },
        }),
      })
    );
  });

  test('applies status filter when provided', async () => {
    prisma.contribution.findMany.mockResolvedValue([]);

    await getContributionData({ ...baseFilters, statuses: ['CONFIRMED'] });

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['CONFIRMED'] },
        }),
      })
    );
  });
});

describe('getPayoutData', () => {
  const baseFilters = {
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    memberId: null,
    statuses: null,
    groupId: 'group-123',
  };

  const mockPayouts = [
    {
      id: 'p1',
      amount: 1000,
      createdAt: new Date('2026-02-10'),
      status: 'SUCCESS',
      reference: 'REF001',
      member: { user: { email: 'alice@test.com' } },
    },
    {
      id: 'p2',
      amount: 500,
      createdAt: new Date('2026-02-20'),
      status: 'FAILED',
      reference: 'REF002',
      member: { user: { email: 'bob@test.com' } },
    },
  ];

  test('returns correctly shaped tableData', async () => {
    prisma.payout.findMany.mockResolvedValue(mockPayouts);

    const result = await getPayoutData(baseFilters);

    expect(result.tableData).toEqual([
      {
        id: 'p1',
        email: 'alice@test.com',
        amount: 1000,
        createdAt: mockPayouts[0].createdAt,
        reference: 'REF001',
        status: 'SUCCESS',
      },
      {
        id: 'p2',
        email: 'bob@test.com',
        amount: 500,
        createdAt: mockPayouts[1].createdAt,
        reference: 'REF002',
        status: 'FAILED',
      },
    ]);
  });

  test('returns correctly shaped pieData', async () => {
    prisma.payout.findMany.mockResolvedValue(mockPayouts);

    const result = await getPayoutData(baseFilters);

    expect(result.pieData).toEqual(
      expect.arrayContaining([
        { status: 'SUCCESS', count: 1 },
        { status: 'FAILED', count: 1 },
      ])
    );
  });

  test('returns barData grouped by month with amounts by status', async () => {
    prisma.payout.findMany.mockResolvedValue(mockPayouts);

    const result = await getPayoutData(baseFilters);

    expect(result.barData).toHaveLength(1); // both in Feb 2026
    expect(result.barData[0]).toMatchObject({
      SUCCESS: 1000,
      FAILED: 500,
    });
  });

  test('returns empty arrays when no payouts match', async () => {
    prisma.payout.findMany.mockResolvedValue([]);

    const result = await getPayoutData(baseFilters);

    expect(result.tableData).toEqual([]);
    expect(result.pieData).toEqual([]);
    expect(result.barData).toEqual([]);
  });

  test('handles missing member gracefully with N/A fallback', async () => {
    prisma.payout.findMany.mockResolvedValue([
      {
        id: 'p3',
        amount: 200,
        createdAt: new Date('2026-03-01'),
        status: 'PENDING',
        reference: 'REF003',
        member: null,
      },
    ]);

    const result = await getPayoutData(baseFilters);

    expect(result.tableData[0].email).toBe('N/A');
  });

  test('applies memberId filter when provided', async () => {
    prisma.payout.findMany.mockResolvedValue([]);

    await getPayoutData({ ...baseFilters, memberId: 'member-99' });

    expect(prisma.payout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberId: { in: ['member-99'] },
        }),
      })
    );
  });
});