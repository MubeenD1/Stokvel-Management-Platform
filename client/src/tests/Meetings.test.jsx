import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MeetingsPage from '../pages/Meetings/MeetingsPage';

// Mock router
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'group-1' }),
  };
});

// Mock firebase
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    },
  },
}));

// Mock MeetingCard
vi.mock('../components/MeetingCard', () => ({
  default: ({ meeting }) => (
    <div data-testid="meeting-card">
      {meeting.agenda}
    </div>
  ),
}));

describe('MeetingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    global.fetch = vi.fn(() =>
      new Promise(() => {})
    );

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders meetings after successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        role: 'ADMIN',
        meetings: [
          {
            id: '1',
            agenda: 'Budget Planning',
          },
          {
            id: '2',
            agenda: 'Monthly Review',
          },
        ],
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Budget Planning')).toBeInTheDocument();
      expect(screen.getByText('Monthly Review')).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('meeting-card')).toHaveLength(2);
  });

  it('shows create meeting button for admin', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        role: 'ADMIN',
        meetings: [],
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/create a meeting/i)
      ).toBeInTheDocument();
    });
  });

  it('does not show create button for member', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        role: 'MEMBER',
        meetings: [],
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/create a meeting/i)
      ).not.toBeInTheDocument();
    });
  });

  it('navigates to create page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        role: 'ADMIN',
        meetings: [],
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    const button = await screen.findByText(/create a meeting/i);

    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/groups/group-1/meetings/create'
    );
  });

  it('shows empty state when no meetings exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        role: 'ADMIN',
        meetings: [],
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /there are currently no meetings scheduled/i
        )
      ).toBeInTheDocument();
    });
  });

  it('shows authorization error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Unauthorized',
      }),
    });

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/unauthorized/i)
      ).toBeInTheDocument();
    });
  });

  it('shows generic fetch error', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('Server down')
    );

    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument();
    });
  });
});