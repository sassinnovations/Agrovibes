import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchProviderKycStatus, fetchProviderListings, type ProviderListing } from "../../api/providerKyc";
import { listingImage } from "./listingImages";
import { listingStatusText } from "./providerStatus";
import { usePullToRefresh } from "./usePullToRefresh";

export function ProviderListingsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ProviderListing[]>([]);
  const [status, setStatus] = useState("not_submitted");
  const [error, setError] = useState("");
  const pageRef = useRef<HTMLElement>(null);

  const load = async () => {
    if (!token) return;
    try {
      const [kyc, listed] = await Promise.all([fetchProviderKycStatus(token), fetchProviderListings(token)]);
      setStatus(kyc.status);
      setRows(listed.listings || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load listings.");
    }
  };

  const pull = usePullToRefresh(pageRef, load);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <section className="provider-panel" ref={pageRef}>
      <div className={`provider-pull${pull.open ? " is-open" : ""}`}>{pull.open ? pull.label : ""}</div>
      <h1>Your listings</h1>
      <p>Create a rental, service, store, or educator listing.</p>
      {status !== "approved" ? (
        <p className="provider-note">
          {status === "rejected"
            ? "Admin rejected your KYC. Verify Aadhaar again. A business also needs PAN or GST."
            : "Admin review is required before your listings go live to customers."}
        </p>
      ) : null}
      {error ? <p className="provider-error">{error}</p> : null}
      <div className="provider-list">
        {rows.map((row) => {
          const photo = row.imageUrl || listingImage(row.id);
          return (
            <article key={row.id} className="provider-card">
              {photo ? <img className="provider-card__photo" src={photo} alt="" /> : null}
              <strong>{row.title}</strong>
              <span>
                {row.category} · {row.channel}
              </span>
              <em>{listingStatusText(row.status)}</em>
            </article>
          );
        })}
      </div>
      <Link className="provider-btn" to="/provider/listings/new">
        New Listing
      </Link>
    </section>
  );
}
