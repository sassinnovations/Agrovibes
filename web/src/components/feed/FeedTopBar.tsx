import { Link } from "react-router-dom";
import { useNotificationPanel } from "../../context/NotificationPanelContext";
import "./FeedTopBar.css";

export function FeedTopBar() {
  const { notificationUnreadCount } = useNotificationPanel();
  const count = Math.min(99, notificationUnreadCount);

  return (
    <header className="feed-topbar">
      <Link to="/" className="feed-topbar__logo" aria-label="Cropvibe feed">
        <img src="/logo-wordmark.png" alt="Cropvibe" />
      </Link>
      <div className="feed-topbar__actions">
        <Link to="/weather" className="feed-topbar__icon" aria-label="Weather" title="Weather">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7.5 16.5a4.5 4.5 0 1 1 1.3-8.8 5.5 5.5 0 0 1 10.4 1.7 3.8 3.8 0 0 1 .3 7.1H7.5Z" />
          </svg>
        </Link>
        <Link to="/search" className="feed-topbar__icon" aria-label="Search" title="Search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm5.7-2.3L21 21" />
          </svg>
        </Link>
        <Link to="/notifications" className="feed-topbar__icon" aria-label="Notifications" title="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 3.2a5.8 5.8 0 0 0-5.8 5.8v3.4l-1.4 2.2a1 1 0 0 0 .8 1.6h12.8a1 1 0 0 0 .8-1.6l-1.4-2.2V9a5.8 5.8 0 0 0-5.8-5.8Z" />
            <path d="M10 18.8a2 2 0 0 0 4 0" />
          </svg>
          {count > 0 ? <span className="feed-topbar__badge">{count}</span> : null}
        </Link>
      </div>
    </header>
  );
}
