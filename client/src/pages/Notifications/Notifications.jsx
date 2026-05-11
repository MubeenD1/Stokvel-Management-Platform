import "./Notifications.css";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";

// ── Helpers

const TYPE_META = {
  MEETING_CREATED: {
    label: "Created",
    badgeClass: "created",
    iconClass: "created",
    icon: "📅",
    getText: (n) =>
      `A new meeting was scheduled for ${n.meeting?.Group?.name ?? "your group"}.`,
  },
  MEETING_UPDATED: {
    label: "Updated",
    badgeClass: "updated",
    iconClass: "updated",
    icon: "✏️",
    getText: (n) =>
      `A meeting for ${n.meeting?.Group?.name ?? "your group"} was updated.`,
  },
  MEETING_DELETED: {
    label: "Cancelled",
    badgeClass: "deleted",
    iconClass: "deleted",
    icon: "🗑️",
    getText: (n) =>
      `A meeting for ${n.meeting?.Group?.name ?? "your group"} was cancelled.`,
  },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatMeetingDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Notification Card

function NotificationCard({ notification }) {
  const meta = TYPE_META[notification.type] ?? {
    label: notification.type,
    badgeClass: "created",
    iconClass: "created",
    icon: "🔔",
    getText: () => "You have a new notification.",
  };

  const iconClass = !notification.success ? "failed" : meta.iconClass;
  const icon = !notification.success ? "⚠️" : meta.icon;

  return (
    <div className="notification-card">
      {/* Icon bubble */}
      <div className={`notif-icon ${iconClass}`}>{icon}</div>

      {/* Body */}
      <div className="notif-body">
        <p className="notif-title">
          <span className={`notif-badge ${meta.badgeClass}`}>{meta.label}</span>
          {meta.getText(notification)}
        </p>

        {notification.meeting && (
          <p className="notif-sub">
            📍 {notification.meeting.location ?? "Location TBD"} &nbsp;·&nbsp;
            🗓 {formatMeetingDate(notification.meeting.date)}
          </p>
        )}

        {!notification.success && notification.error && (
          <p className="notif-error">⚠️ Delivery failed: {notification.error}</p>
        )}
      </div>

      {/* Timestamp */}
      <span className="notif-time">{formatDate(notification.sentAt)}</span>
    </div>
  );
}

// ── Page 

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const token = await auth.currentUser.getIdToken();

        const response = await fetch(import.meta.env.VITE_API_URL + "/api/groups/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          setError(errData.error || "Failed to fetch notifications");
          return;
        }

        const data = await response.json();
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      } catch (err) {
        setError("Something went wrong. Please refresh the page.");
        console.error("fetchNotifications error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        {notifications.length > 0 && (
          <button
            className="clear-btn"
            onClick={() => setNotifications([])}
          >
            Clear all
          </button>
        )}
      </div>

      {/* States */}
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <div className="notif-empty">
          <span className="empty-icon">🔕</span>
          <p>You're all caught up — no notifications yet.</p>
        </div>
      )}

      {/* Cards */}
      {notifications.map((notif) => (
        <NotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  );
}
