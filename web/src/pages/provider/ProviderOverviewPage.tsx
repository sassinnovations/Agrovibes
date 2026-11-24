import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchProviderKycStatus, fetchProviderListings } from "../../api/providerKyc";
import { readSavedBank } from "./ProviderBankPage";

export function ProviderOverviewPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState("not_submitted");
  const [approvedListings, setApprovedListings] = useState(0);
  const [savedBank, setSavedBank] = useState(() => readSavedBank());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      try {
        const [kyc, listed] = await Promise.all([fetchProviderKycStatus(token), fetchProviderListings(token)]);
        if (!active) return;
        setStatus(kyc.status);
        setApprovedListings((listed.listings || []).filter((row) => row.status === "approved").length);
        setSavedBank(readSavedBank());
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load provider setup.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const approved = status === "approved";
  const bankReady = Boolean(savedBank?.accountNumber);
  const payoutReady = Boolean(savedBank?.razorpayAccountId);
  const bookingsOn = approved && bankReady && payoutReady && approvedListings > 0;
  const canAddBank = approved && !payoutReady;

  const steps = [
    {
      title: "Provider Registration",
      detail: "Individual / Business → DigiLocker → Admin approval",
      done: approved
    },
    {
      title: "Provider Dashboard Unlocked",
      detail: "Provider can add tractors and other equipment",
      done: approved
    },
    {
      title: "Add Bank Account (One Time)",
      detail: payoutReady ? "Bank verified and Razorpay account linked." : bankReady ? "Bank verified. Razorpay onboarding is still open." : "Verify bank details and complete Razorpay onboarding",
      done: payoutReady
    },
    {
      title: "Online Bookings Enabled",
      detail: bookingsOn ? "For approved equipment with availability" : "For approved equipment, after the bank and Razorpay checks succeed",
      done: bookingsOn
    }
  ];

  return (
    <section className="provider-flow">
      {steps.map((step, index) => {
        const openBank = canAddBank && step.title.startsWith("Add Bank Account");
        return (
          <div key={step.title}>
            {openBank ? (
              <Link to="/provider/bank" className="provider-flow__card">
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </Link>
            ) : (
              <article className={`provider-flow__card${step.done ? " is-done" : ""}`}>
                <strong>{step.done ? "✓ " : ""}{step.title}</strong>
                <span>{step.detail}</span>
              </article>
            )}
            {index < steps.length - 1 ? <div className="provider-flow__arrow" aria-hidden>↓</div> : null}
          </div>
        );
      })}

      {!approved ? (
        <Link className="provider-flow__link" to={status === "pending" ? "/" : "/provider/join"}>
          {status === "pending" ? "Back to CropVibe feed" : status === "rejected" ? "Review and submit again" : "Continue registration"}
        </Link>
      ) : null}
      {error ? <p className="provider-error">{error}</p> : null}
    </section>
  );
}
