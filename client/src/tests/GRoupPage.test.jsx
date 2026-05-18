import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import GroupPage from '../pages/Groups/GroupPage'

// ----------------------
// Firebase mock (FIXED)
// ----------------------
const onAuthStateChangedMock = vi.hoisted(() => vi.fn())
const getIdTokenMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue('token')
)

vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: onAuthStateChangedMock,
    currentUser: {
      uid: 'user-1',
      email: 'admin@test.com',
      getIdToken: getIdTokenMock,
    },
  },
}))

// ----------------------
// Router helper (FIXED PATH)
// ----------------------
const renderWithRouter = () => {
  return render(
    // Match the exact route structure your application uses
    <MemoryRouter initialEntries={['/groups/group-123/members']}>
      <Routes>
        <Route path="/groups/:id/members" element={<GroupPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// ----------------------
// Fetch helper
// ----------------------
const mockFetch = (data, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
    })
  )
}

// ----------------------
// Tests
// ----------------------
describe('GroupPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    onAuthStateChangedMock.mockImplementation((cb) => {
      cb({
        uid: 'user-1',
        email: 'admin@test.com',
        getIdToken: getIdTokenMock,
      })
      return () => {}
    })
  })

  test('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))

    renderWithRouter()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('renders members list', async () => {
    mockFetch({
      groupMembers: [
        {
          id: 'm1',
          role: 'MEMBER',
          user: {
            email: 'test@example.com',
            firebaseId: 'user-1',
          },
        },
        {
          id: 'm2',
          role: 'MEMBER',
          user: {
            email: 'other@example.com',
            firebaseId: 'user-2',
          },
        },
      ],
    })

    renderWithRouter()

    expect(await screen.findByText('test@example.com')).toBeInTheDocument()
    expect(await screen.findByText('other@example.com')).toBeInTheDocument()
  })

  test('highlights current user as YOU', async () => {
    mockFetch({
      groupMembers: [
        {
          id: 'm1',
          role: 'ADMIN',
          user: {
            email: 'test@example.com',
            firebaseId: 'user-1',
          },
        },
      ],
    })

    renderWithRouter()

    expect(await screen.findByText(/you/i)).toBeInTheDocument()
  })

  test('shows invite button for admin', async () => {
    mockFetch({
      groupMembers: [
        {
          id: 'm1',
          role: 'ADMIN',
          user: {
            email: 'test@example.com',
            firebaseId: 'user-1',
          },
        },
      ],
    })

    renderWithRouter()

    expect(await screen.findByText('Invite Others')).toBeInTheDocument()
  })

  test('shows error state when fetch fails', async () => {
    mockFetch({ error: 'Failed' }, false)

    renderWithRouter()

    expect(await screen.findByText('Failed to fetch members')).toBeInTheDocument()
  })

  test('opens role editor when Change Role clicked', async () => {
    mockFetch({
      groupMembers: [
        {
          id: 'm1',
          role: 'ADMIN',
          user: {
            email: 'admin@test.com',
            firebaseId: 'user-1', // Required so component authorizes admin controls
          },
        },
        {
          id: 'm2',
          role: 'MEMBER',
          user: {
            email: 'other@example.com',
            firebaseId: 'user-2',
          },
        },
      ],
    })

    renderWithRouter()

    // Wait for data to load
    await screen.findByText('other@example.com')

    // Find and click the action trigger
    const button = await screen.findByText(/change role/i)
    await user.click(button)

    expect(screen.getByDisplayValue(/member/i)).toBeInTheDocument()
  })

  test('does not show Change Role for self', async () => {
    mockFetch({
      groupMembers: [
        {
          id: 'm1',
          role: 'ADMIN',
          user: {
            email: 'test@example.com',
            firebaseId: 'user-1',
          },
        },
      ],
    })

    renderWithRouter()

    expect(await screen.findByText('Admin (Protected)')).toBeInTheDocument()
    expect(screen.queryByText('Change Role')).not.toBeInTheDocument()
  })
})