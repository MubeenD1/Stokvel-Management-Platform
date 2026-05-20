import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PayoutsPage from '../pages/Payouts/PayoutsPage'
import { auth } from '../firebase'

// 1. Mock 'react-router-dom' parameters
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'group-xyz-789' }),
  }
})

// 2. STUB SUBCOMPONENTS DIRECTLY VIA ABSOLUTE ALIASES
// This intercepts the components no matter what import path or file-URL resolution is used
vi.mock('/src/components/AdminUpcomingView', () => ({
  default: ({ groupId }) => <div data-testid="admin-view">Admin Workspace Group: {groupId}</div>,
}))

vi.mock('/src/components/MemberPastPayouts', () => ({
  default: ({ groupId, userToken }) => (
    <div data-testid="member-view">
      Member Workspace Group: {groupId} with Token: {userToken}
    </div>
  ),
}))

// 3. Mock useAuth hook safely to prevent destructuring failures inside child contexts
vi.mock('/src/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'user-generic', email: 'test@test.com' }
  })
}))

// 4. Set Environment Variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3000')

describe('PayoutsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    
    // Default fallback so auth won't crash on initial render tracking
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementation((callback) => {
      return () => {}
    })
  })

  test('displays loading visual block text safely layout on base instantiation state', () => {
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce(() => () => {})

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading Payouts...')).toBeInTheDocument()
  })

  test('renders MemberPastPayouts view workspace standard layout for default regular member entries', async () => {
    const mockFirebaseUser = {
      uid: 'user-001',
      email: 'member@test.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-member-token'),
    }

    let triggerAuthChange
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((callback) => {
      triggerAuthChange = callback
      return () => {}
    })

    const mockGroupPayload = {
      groupMembers: [
        { user: { firebaseId: 'user-001', email: 'member@test.com' }, role: 'MEMBER' }
      ]
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupPayload,
    })

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await triggerAuthChange(mockFirebaseUser)
    })

    await waitFor(() => {
      expect(screen.queryByText('Loading Payouts...')).not.toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/groups/group-xyz-789', {
      headers: { 'Authorization': 'Bearer jwt-member-token' }
    })

    expect(screen.getByTestId('member-view')).toHaveTextContent(
      'Member Workspace Group: group-xyz-789 with Token: jwt-member-token'
    )
  })

  test('renders AdminUpcomingView layout if membership parameters establish ADMIN clearance tier', async () => {
    const mockFirebaseUser = {
      uid: 'user-002',
      email: 'admin@test.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-admin-token'),
    }

    let triggerAuthChange
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((callback) => {
      triggerAuthChange = callback
      return () => {}
    })

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        groupMembers: [{ user: { firebaseId: 'user-002', email: 'admin@test.com' }, role: 'ADMIN' }]
      }),
    })

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await triggerAuthChange(mockFirebaseUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('admin-view')).toHaveTextContent('Admin Workspace Group: group-xyz-789')
    })
  })

  test('renders AdminUpcomingView structure layout option block when user role is TREASURER', async () => {
    const mockFirebaseUser = {
      uid: 'user-003',
      email: 'treasurer@test.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-treasurer-token'),
    }

    let triggerAuthChange
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((callback) => {
      triggerAuthChange = callback
      return () => {}
    })

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        groupMembers: [{ user: { firebaseId: 'user-003', email: 'treasurer@test.com' }, role: 'TREASURER' }]
      }),
    })

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await triggerAuthChange(mockFirebaseUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('admin-view')).toHaveTextContent('Admin Workspace Group: group-xyz-789')
    })
  })

  test('defaults fallback context values to MEMBER if verification properties matching data parameters are completely absent', async () => {
    const mockFirebaseUser = {
      uid: 'user-999',
      email: 'stranger@test.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-stranger-token'),
    }

    let triggerAuthChange
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((callback) => {
      triggerAuthChange = callback
      return () => {}
    })

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groupMembers: [] }),
    })

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await triggerAuthChange(mockFirebaseUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('member-view')).toBeInTheDocument()
    })
  })



  test('displays fetch parsing processing error status state notifications correctly when api route channels fail', async () => {
    const mockFirebaseUser = {
      uid: 'user-001',
      email: 'member@test.com',
      getIdToken: vi.fn().mockResolvedValue('jwt-token'),
    }

    let triggerAuthChange
    vi.spyOn(auth, 'onAuthStateChanged').mockImplementationOnce((callback) => {
      triggerAuthChange = callback
      return () => {}
    })

    // Simulate an HTTP 500 or 404 error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
    })

    render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await triggerAuthChange(mockFirebaseUser)
    })

    // FIX: Match the actual DOM output your component renders on non-ok responses
    await waitFor(() => {
      expect(screen.getByText('Server connection error')).toBeInTheDocument()
    })
  })

  test('calls component lifecycle subscription cancellation teardown hooks loops cleanly during component unmounting processing sequences', () => {
    const mockUnsubscribe = vi.fn()
    vi.spyOn(auth, 'onAuthStateChanged').mockReturnValueOnce(mockUnsubscribe)

    const { unmount } = render(
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    )

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})