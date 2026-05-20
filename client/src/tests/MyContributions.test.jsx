import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MyContributions from '../pages/Contributions/MyContributions' // Adjust path if needed


// 1. Mock 'react-router-dom' hooks for route parameters and search query params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'group-abc-123' }),
    useSearchParams: () => [new URLSearchParams('role=member')],
  }
})

// 2. Mock your Auth Context Provider with displayName to test the split logic
vi.mock('/src/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { 
      uid: 'user-789', 
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      getIdToken: vi.fn().mockResolvedValue('mock-jwt-token')
    },
  }),
}))

// Duplicate path mapping for reliable compiler resolution across environments
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { 
      uid: 'user-789', 
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      getIdToken: vi.fn().mockResolvedValue('mock-jwt-token')
    },
  }),
}))

// 3. Mock child button component to keep tests lightweight and focused
vi.mock('../../components/MakeContributtionButton', () => ({
  default: ({ groupId, groupMemberId, role, amount, user }) => (
    <button data-testid="mock-contrib-btn">
      Pay R{amount} as {user.firstName} ({role})
    </button>
  ),
}))

vi.mock('/src/components/MakeContributtionButton', () => ({
  default: ({ groupId, groupMemberId, role, amount, user }) => (
    <button data-testid="mock-contrib-btn">
      Pay R{amount} as {user.firstName} ({role})
    </button>
  ),
}))

// 4. Mock the API URL environment variable
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

describe('MyContributions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    // Clean up injected scripts from DOM before each test run
    document.body.innerHTML = ''
  })

  test('injects the PayFast script tag into the document body header on mount', () => {
    // We mock fetch so the test doesn't crash on mounting layout steps
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <MyContributions />
      </MemoryRouter>
    )

    const script = document.querySelector('script[src="https://sandbox.payfast.co.za/onsite/engine.js"]')
    expect(script).toBeInTheDocument()
  })

  test('renders loader initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <MyContributions />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading contributions...')).toBeInTheDocument()
  })

  test('renders structural contribution history entries accurately', async () => {
    const mockPayload = {
      groupMemberId: 'mem-999',
      contributionAmount: 450,
      contributions: [
        { id: 'c1', date: '2026-05-10T10:00:00.000Z', amount: 450.00, status: 'CONFIRMED', confirmedBy: 'Admin Jane' },
        { id: 'c2', date: '2026-04-10T10:00:00.000Z', amount: 400.00, status: 'PENDING', confirmedBy: null }
      ]
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    })

    render(
      <MemoryRouter>
        <MyContributions />
      </MemoryRouter>
    )

    // Wait for loader state clearance
    await waitFor(() => {
      expect(screen.queryByText('Loading contributions...')).not.toBeInTheDocument()
    })

    // Assert the Fetch target path matches params structures
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/contributions/group-abc-123', expect.any(Object))

    // Assert core table layout items display properly
    expect(screen.getByText((content) => content.includes('R450.00'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('R400.00'))).toBeInTheDocument()

    expect(screen.getByText('CONFIRMED')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('Admin Jane')).toBeInTheDocument()
    
    // Assert null handler fallback operates correctly
    expect(screen.getByText('—')).toBeInTheDocument()

    // Assert the component extracted props correctly for the child payment button
    expect(screen.getByTestId('mock-contrib-btn')).toHaveTextContent('Pay R450 as John (member)')
  })

  test('displays empty history notification message if record list array is clear', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groupMemberId: 'm1', contributionAmount: 200, contributions: [] }),
    })

    render(
      <MemoryRouter>
        <MyContributions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No contributions found.')).toBeInTheDocument()
    })
  })

  test('displays error text state if database backend routing pipeline fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    })

    render(
      <MemoryRouter>
        <MyContributions />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch contributions')).toBeInTheDocument()
    })
  })
})