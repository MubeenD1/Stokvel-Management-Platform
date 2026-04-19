import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Contributions from '../pages/Contributions/Contributions'
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    }
  })
}))

// Helper to render with router
const renderWithRouter = (groupId = 'group-123') => {
  return render(
    <MemoryRouter initialEntries={[`/contributions/${groupId}`]}>
      <Routes>
        <Route path="/contributions/:groupId" element={<Contributions />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Contributions page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))
    renderWithRouter()
    expect(screen.getByText('Loading contributions...')).toBeInTheDocument()
  })

  test('shows error message when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' })
      })
    )
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch contributions')).toBeInTheDocument()
    })
  })

  test('shows no contributions message when list is empty', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contributions: [] })
      })
    )
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('No contributions found.')).toBeInTheDocument()
    })
  })

  test('displays contributions table with correct data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contributions: [
              {
                id: 'contrib-1',
                amount: 500,
                date: '2026-01-01T00:00:00.000Z',
                status: 'CONFIRMED',
                confirmedBy: 'treasurer@test.com',
                createdAt: '2026-01-01T00:00:00.000Z'
              }
            ]
          })
      })
    )
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('R500.00')).toBeInTheDocument()
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument()
      expect(screen.getByText('treasurer@test.com')).toBeInTheDocument()
    })
  })
})