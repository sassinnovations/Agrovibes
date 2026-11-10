import { Outlet, useLocation } from "react-router-dom";
import { FeedTabBar } from "../feed/FeedTabBar";
import "./AppShell.css";

const FLUSH_ROUTES = new Set(["/drops", "/reels", "/messages"]);

export function AppShell() {
  const { pathname } = useLocation();
  const providerApp = pathname === "/provider" || (pathname.startsWith("/provider/") && !pathname.startsWith("/provider/join"));
  const flushContent = FLUSH_ROUTES.has(pathname) || pathname.startsWith("/messages/");
  const notificationsView = pathname === "/notifications" || pathname === "/weather" || pathname.startsWith("/schemes");

  return (
    <div className={`app-shell${providerApp ? " app-shell--provider" : " app-shell--feed"}`}>
      <div className="app-shell__main">
        <div
          className={`app-shell__content${flushContent ? " app-shell__content--flush" : ""}${notificationsView ? " app-shell__content--notifications" : ""}`}
        >
          <Outlet />
        </div>
      </div>
      {providerApp ? null : <FeedTabBar />}
    </div>
  );
}
