import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchProviderKycStatus } from "../../api/providerKyc";
import { useAuth } from "../../auth/AuthContext";
import { readSavedBank } from "./ProviderBankPage";

export function RequireProviderBank() {
  const { token } = useAuth();
  const [gate, setGate] = useState<"loading" | "allow" | "bank" | "overview">("loading");

  useEffect(() => {
    if (readSavedBank()?.accountNumber) {
      setGate("allow");
      return;
    }
    if (!token) {
      setGate("overview");
      return;
    }
    let active = true;
    void fetchProviderKycStatus(token)
      .then((kyc) => {
        if (!active) return;
        setGate(String(kyc.status).toLowerCase() === "approved" ? "bank" : "overview");
      })
      .catch(() => {
        if (active) setGate("overview");
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (gate === "loading") return <p className="provider-note">Loading…</p>;
  if (gate === "bank") return <Navigate to="/provider/bank" replace />;
  if (gate === "overview") return <Navigate to="/provider" replace />;
  return <Outlet />;
}
