// =========================
// 1. ENVIRONMENT VARIABLES SETUP
// =========================
process.env.PAYFAST_MERCHANT_ID = '12345';
process.env.PAYFAST_MERCHANT_KEY = 'abcde';
process.env.PAYFAST_PASS_KEY = 'supersecret';
process.env.NOTIFY_URL = 'https://myapi.com/payfast/notify';

// =========================
// 2. MOCKS
// =========================
jest.mock('../controllers/contributionService', () => ({
  saveContribution: jest.fn(),
}));

jest.mock('../src/utils/notificationService', () => ({
  sendContributionEmail: jest.fn(),
}));

// =========================
// 3. IMPORTS
// =========================
const { initiatePayment, handleNotify } = require('../controllers/payfastControllers'); // Adjust path as needed
const { saveContribution } = require('../controllers/contributionService');
const { sendContributionEmail } = require('../src/utils/notificationService');

describe('PayFast Controller Suite', () => {
  let req, res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test initiatePayment
  // ─────────────────────────────────────────────────────────────────────────
  describe('initiatePayment', () => {
    test('successfully builds and signs a valid PayFast redirect sandbox URL', async () => {
      req = {
        body: {
          name_first: 'John',
          name_last: 'Doe',
          email_address: 'john@doe.com',
          amount: '250.00',
          item_name: 'Monthly Contribution',
          groupId: 'group-789',
          role: 'MEMBER',
          groupMemberId: 'member-123',
        },
      };

      await initiatePayment(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUrl: expect.stringContaining('https://sandbox.payfast.co.za/eng/process'),
        })
      );

      const responseUrl = res.json.mock.calls[0][0].redirectUrl;
      // Assert that critical strings are included and properly URL encoded
      expect(responseUrl).toContain('merchant_id=12345');
      expect(responseUrl).toContain('amount=250.00');
      expect(responseUrl).toContain('item_name=Monthly+Contribution');
      expect(responseUrl).toContain('signature='); // Check that signature hashing was appended
    });

    test('gracefully catches unexpected inner execution exceptions', async () => {
      req = { body: null }; // Will trigger a type explosion when destructured

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to initiate payment' });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test handleNotify (Webhook ITN)
  // ─────────────────────────────────────────────────────────────────────────
  describe('handleNotify', () => {
    test('exits early with a 200 status if transaction payload status is not COMPLETE', async () => {
      req = {
        body: {
          payment_status: 'FAILED',
          amount_gross: '250.00',
        },
      };

      await handleNotify(req, res);

      expect(saveContribution).not.toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    test('processes complete payments, triggers local sync, and fires off notification updates', async () => {
      req = {
        body: {
          payment_status: 'COMPLETE',
          amount_gross: '500.00',
          custom_str1: 'group-789',
          custom_str2: 'member-123',
          email_address: 'alice@test.com',
          name_first: 'Alice',
        },
      };

      // Mock database save routine responses
      const mockSavedContribution = {
        id: 'contrib-111',
        group: { name: 'Super Stokvel' },
      };
      saveContribution.mockResolvedValue(mockSavedContribution);

      await handleNotify(req, res);

      expect(saveContribution).toHaveBeenCalledWith({
        amount: '500.00',
        groupId: 'group-789',
        groupMemberId: 'member-123',
      });

      expect(sendContributionEmail).toHaveBeenCalledWith({
        toEmail: 'alice@test.com',
        name: 'Alice',
        amount: '500.00',
        groupName: 'Super Stokvel',
      });

      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    test('responds with a 500 status code if internal transaction resolution routines crash', async () => {
      req = {
        body: { payment_status: 'COMPLETE' },
      };
      saveContribution.mockRejectedValue(new Error('Prisma write validation timeout'));

      await handleNotify(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(500);
    });
  });
});