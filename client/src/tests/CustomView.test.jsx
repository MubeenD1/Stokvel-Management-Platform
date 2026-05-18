import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import CustomView from '../pages/Analytics/CustomView'

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    },
    onAuthStateChanged: vi.fn((callback) => {
      callback({
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      })

      return vi.fn()
    }),
  },
}))

// Mock chart components
vi.mock('../pages/Analytics/AnalyticsComponents/ContributionBarChart', () => ({
  default: () => <div>Contribution Bar Chart</div>,
}))

vi.mock('../pages/Analytics/AnalyticsComponents/ContributionPieChart', () => ({
  default: () => <div>Contribution Pie Chart</div>,
}))

vi.mock('../pages/Analytics/AnalyticsComponents/PayoutsBarChart', () => ({
  default: () => <div>Payouts Bar Chart</div>,
}))

vi.mock('../pages/Analytics/AnalyticsComponents/PayoutsPieChart', () => ({
  default: () => <div>Payouts Pie Chart</div>,
}))

vi.mock('../pages/Analytics/AnalyticsComponents/ContributionsTable', () => ({
  default: () => <div>Contributions Table</div>,
}))

vi.mock('../pages/Analytics/AnalyticsComponents/PayoutsTable', () => ({
  default: () => <div>Payouts Table</div>,
}))

// Mock html2pdf
vi.mock('html2pdf.js', () => ({
  default: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue(),
  })),
}))

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/analytics/group-123']}>
      <Routes>
        <Route path="/analytics/:id" element={<CustomView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CustomView Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    global.fetch = vi.fn((url) => {
      // Members fetch
      if (String(url).includes('/api/groups/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              groupMembers: [
                {
                  id: 'member-1',
                  user: {
                    email: 'member@test.com',
                  },
                },
              ],
            }),
        })
      }

      // Analytics fetch
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            tableData: [
              {
                id: '1',
                amount: 500,
                status: 'CONFIRMED',
                user: {
                  email: 'member@test.com',
                },
                contributionDate: '2026-01-01',
              },
            ],
          }),
      })
    })
  })

  test('renders page title and form fields', async () => {
    renderWithRouter()

    expect(screen.getByText('Custom Report')).toBeInTheDocument()

    expect(screen.getByText(/Complete all these/i)).toBeInTheDocument()

    expect(screen.getByText('Select Members')).toBeInTheDocument()

    expect(screen.getByText('Type')).toBeInTheDocument()

    expect(screen.getByText('Status')).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /Apply Filters/i })
    ).toBeInTheDocument()
  })

  test('loads and displays members', async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })
  })

  test('submits filters and displays contribution analytics', async () => {
    renderWithRouter()

    const startDateInputs = screen.getAllByDisplayValue('')

    fireEvent.change(startDateInputs[0], {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(startDateInputs[1], {
      target: { value: '2026-06-01' },
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: /Apply Filters/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Contribution Bar Chart')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Contribution Pie Chart')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Contributions Table')
      ).toBeInTheDocument()
    })
  })

  test('switches to payout mode and displays payout analytics', async () => {
    renderWithRouter()

    const typeSelect = screen.getByDisplayValue('Contribution')

    fireEvent.change(typeSelect, {
      target: { value: 'Payout' },
    })

    const startDateInputs = screen.getAllByDisplayValue('')

    fireEvent.change(startDateInputs[0], {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(startDateInputs[1], {
      target: { value: '2026-06-01' },
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: /Apply Filters/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Payouts Bar Chart')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Payouts Pie Chart')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Payouts Table')
      ).toBeInTheDocument()
    })
  })

  test('shows error message when analytics fetch fails', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/api/groups/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              groupMembers: [],
            }),
        })
      }

      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'Failed to fetch analytics',
          }),
      })
    })

    renderWithRouter()

    const startDateInputs = screen.getAllByDisplayValue('')

    fireEvent.change(startDateInputs[0], {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(startDateInputs[1], {
      target: { value: '2026-06-01' },
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: /Apply Filters/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch analytics')
      ).toBeInTheDocument()
    })
  })

 test('shows loading state while fetching analytics', async () => {
  global.fetch = vi.fn(() => new Promise(() => {}))

  renderWithRouter()

  const dateInputs = screen.getAllByDisplayValue('')

  fireEvent.change(dateInputs[0], {
    target: { value: '2026-01-01' },
  })

  fireEvent.change(dateInputs[1], {
    target: { value: '2026-06-01' },
  })

  fireEvent.click(
    screen.getByRole('button', { name: /Apply Filters/i })
  )

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Loading/i })
    ).toBeDisabled()
  })
})

  test('renders export buttons after data loads', async () => {
    renderWithRouter()

    const startDateInputs = screen.getAllByDisplayValue('')

    fireEvent.change(startDateInputs[0], {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(startDateInputs[1], {
      target: { value: '2026-06-01' },
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: /Apply Filters/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Export CSV/i)
      ).toBeInTheDocument()

      expect(
        screen.getByText(/Export PDF/i)
      ).toBeInTheDocument()
    })
  })

  test('handles member checkbox selection', async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })

    const checkbox = screen.getAllByRole('checkbox')[1]

    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })
})