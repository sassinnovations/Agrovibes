import { Outlet } from "react-router-dom";
import "./ProviderDashboard.css";

export function ProviderDashboard() {
  return (
    <div className="provider-app">
      <div className="provider-app__body">
        <Outlet />
      </div>
    </div>
  );
}
