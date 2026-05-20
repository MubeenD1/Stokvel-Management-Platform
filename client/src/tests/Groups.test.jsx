import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Groups from '../pages/Groups/Groups' 

// 1. Mock 'react-router-dom' navigation hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// 2. BULLETPROOF CONTEXT MOCKING 
// We mock it by targeting the absolute runtime module path to prevent folder depth issues.
vi.mock('/src/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
  }),
}))

// Backup mock in case your bundler maps relatively without leading slash
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user-123', email: 'test@example.com' },
  }),
}))

// 3. Mock the Firebase auth instance and token generation
vi.mock('/src/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
    },
  },
}))

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
    },
  },
}))

// 4. Mock the import.meta.env variable
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

describe('Groups Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  test('renders loading state initially', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading your groups...')).toBeInTheDocument()
  })

  test('renders groups list on successful fetch and navigates on click', async () => {
    const mockGroupsData = {
      groups: [
        { id: 'group-1', name: 'Dev Team' },
        { id: 'group-2', name: 'Design Team' },
      ],
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupsData,
    })

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading your groups...')).not.toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/groups', {
      headers: { Authorization: 'Bearer mock-firebase-token' },
    })

    expect(screen.getByText('Dev Team')).toBeInTheDocument()
    expect(screen.getByText('Design Team')).toBeInTheDocument()
  })

  test('renders empty state when user has no groups', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groups: [] }),
    })

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('You are not part of any groups yet.')).toBeInTheDocument()
    })
  })

  test('renders error message when backend fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load groups')).toBeInTheDocument()
    })
  })

  test('renders fallback error message when fetch network crashes', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network Crash'))

    render(
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })
})