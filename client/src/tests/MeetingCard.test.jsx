import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MeetingCard from '../components/MeetingCard';

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
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

const mockMeeting = {
  id: 'meeting-1',
  agenda: 'Financial Planning',
  location: 'Boardroom',
  date: '2025-01-01T10:00:00Z',
  minutes: '',
};

describe('MeetingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders meeting details', () => {
    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Financial Planning')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Boardroom')
    ).toBeInTheDocument();

    expect(
      screen.getByText(/no minutes yet/i)
    ).toBeInTheDocument();
  });

  it('shows edit button for admin', () => {
    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/edit minutes/i)
    ).toBeInTheDocument();
  });

  it('hides edit button for member', () => {
    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="MEMBER"
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/edit minutes/i)
    ).not.toBeInTheDocument();
  });

  it('opens editor when edit button clicked', () => {
    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/edit minutes/i)
    );

    expect(
      screen.getByPlaceholderText(/add meeting minutes/i)
    ).toBeInTheDocument();
  });

  it('shows validation error for empty minutes', async () => {
    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/edit minutes/i)
    );

    fireEvent.click(
      screen.getByText(/save/i)
    );

    expect(
      screen.getByText(/cannot add empty minutes/i)
    ).toBeInTheDocument();
  });

  it('saves minutes successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/edit minutes/i)
    );

    fireEvent.change(
      screen.getByPlaceholderText(/add meeting minutes/i),
      {
        target: {
          value: 'Meeting minutes content',
        },
      }
    );

    fireEvent.click(
      screen.getByText(/save/i)
    );

    await waitFor(() => {
      expect(
        screen.getByText('Meeting minutes content')
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('shows unauthorized error when save fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Forbidden',
      }),
    });

    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/edit minutes/i)
    );

    fireEvent.change(
      screen.getByPlaceholderText(/add meeting minutes/i),
      {
        target: {
          value: 'Minutes',
        },
      }
    );

    fireEvent.click(
      screen.getByText(/save/i)
    );

    await waitFor(() => {
      expect(
        screen.getByText(/not authorized/i)
      ).toBeInTheDocument();
    });
  });

  it('shows generic save error', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('Server error')
    );

    render(
      <MemoryRouter>
        <MeetingCard
          meeting={mockMeeting}
          role="ADMIN"
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/edit minutes/i)
    );

    fireEvent.change(
      screen.getByPlaceholderText(/add meeting minutes/i),
      {
        target: {
          value: 'Minutes',
        },
      }
    );

    fireEvent.click(
      screen.getByText(/save/i)
    );

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument();
    });
  });
});