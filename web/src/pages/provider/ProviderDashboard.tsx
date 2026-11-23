import { Link, Outlet } from "react-router-dom";
import "./ProviderDashboard.css";

export function ProviderDashboard() {
  return (
    <div className="provider-app">
      <header className="provider-app__top">
        <Link to="/" className="provider-app__logo" aria-label="Cropvibe feed">
          <img src="/logo-wordmark.png" alt="Cropvibe" />
        </Link>
        <div className="provider-app__actions">
          <Link to="/weather" aria-label="Weather" title="Weather">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7.5 16.5a4.5 4.5 0 1 1 1.3-8.8 5.5 5.5 0 0 1 10.4 1.7 3.8 3.8 0 0 1 .3 7.1H7.5Z" />
            </svg>
          </Link>
          <Link to="/notifications" aria-label="Notifications" title="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3.2a5.8 5.8 0 0 0-5.8 5.8v3.4l-1.4 2.2a1 1 0 0 0 .8 1.6h12.8a1 1 0 0 0 .8-1.6l-1.4-2.2V9a5.8 5.8 0 0 0-5.8-5.8Z" />
              <path d="M10 18.8a2 2 0 0 0 4 0" />
            </svg>
          </Link>
        </div>
      </header>
      <div className="provider-app__body">
        <Outlet />
      </div>
    </div>
  );
}
