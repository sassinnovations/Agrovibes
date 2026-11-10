import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useCreateModal } from "../../context/CreateModalContext";
import { useNotificationPanel } from "../../context/NotificationPanelContext";
import "./FeedTabBar.css";

export function FeedTabBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { openCreate } = useCreateModal();
  const { messageUnreadCount } = useNotificationPanel();
  const home = pathname === "/";
  const rentals = pathname.startsWith("/rentals");
  const chat = pathname.startsWith("/messages");
  const profile = pathname === "/profile" || pathname.startsWith("/profile/");
  const initial = (user?.fullName || user?.username || "?").trim().charAt(0).toUpperCase() || "?";
  const unread = Math.min(99, messageUnreadCount);

  return (
    <nav className="feed-tabs" aria-label="Cropvibe">
      <NavLink to="/" end className={`feed-tabs__item${home ? " is-active" : ""}`} aria-label="Home">
        <img className="feed-tabs__logo" src="/logo-wordmark.png" alt="" />
      </NavLink>
      <NavLink to="/rentals" className={`feed-tabs__item${rentals ? " is-active" : ""}`}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4 16.5h16M6.5 16.5v-4h11v4M8 12.5 10 8h4l2 4.5" />
          <path d="M7.5 16.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm9 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
        </svg>
        <span>Rentals</span>
      </NavLink>
      <button type="button" className="feed-tabs__item" onClick={openCreate}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Create</span>
      </button>
      <NavLink to="/messages" className={`feed-tabs__item${chat ? " is-active" : ""}`}>
        <span className="feed-tabs__icon">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 4.2c-4.9 0-8.8 3.2-8.8 7.3 0 2.3 1.2 4.3 3.2 5.7v2.6a.6.6 0 0 0 1 .5l2.8-1.7c.6.1 1.2.2 1.8.2 4.9 0 8.8-3.2 8.8-7.3S16.9 4.2 12 4.2Z" />
          </svg>
          {unread > 0 ? <em>{unread}</em> : null}
        </span>
        <span>Chat</span>
      </NavLink>
      <NavLink to="/profile" className={`feed-tabs__item${profile ? " is-active" : ""}`}>
        <span className={`feed-tabs__avatar${profile ? " is-active" : ""}`}>
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initial}
        </span>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
