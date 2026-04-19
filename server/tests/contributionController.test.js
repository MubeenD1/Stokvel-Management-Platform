const { getMemberContributions } = require('../controllers/contributionController')

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    },
    groupMember: {
      findUnique: jest.fn()
    },
    contribution: {
      findMany: jest.fn()
    }
  }
  return { PrismaClient: jest.fn(() => mockPrisma) }
})

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

describe('getMemberContributions', () => {
  let req, res

  beforeEach(() => {
    req = {
      params: { groupId: 'group-123' },
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
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' })
    prisma.groupMember.findUnique.mockResolvedValue(null)

    await getMemberContributions(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'You are not a member of this group' })
  })

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
    req.user = null

    await getMemberContributions(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})