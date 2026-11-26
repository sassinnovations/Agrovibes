import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminListings, respondAdminListing, type AdminListingRow } from "../api/listings";
import "./ListingsPage.css";

type ListingFilter = "all" | "active" | "flagged" | "pending";

const PAGE_SIZE = 10;
const FILTERS: { id: ListingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "flagged", label: "Flagged" },
  { id: "pending", label: "Pending" }
];

function displayStatus(status: AdminListingRow["status"]) {
  if (status === "Approved") return "Active";
  if (status === "Unpublished") return "Removed";
  return "Pending";
}

function roleLabel(role?: string) {
  const value = String(role || "Provider").trim();
  if (!value) return "Provider";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function areaLabel(row: AdminListingRow) {
  const km = Number(row.radiusKm);
  const radius = Number.isFinite(km) && km > 0 ? Math.round(km) : 10;
  const place = row.locationLabel?.trim();
  if (!row.hasArea) return "Area not set";
  return place ? `${place} · ${radius} km` : `Within ${radius} km`;
}

function rateLabel(row: AdminListingRow) {
  const amount = Number(String(row.rate ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "Rate on request";
  const unit = row.rateUnit?.trim();
  return `₹${Math.round(amount).toLocaleString("en-IN")}${unit ? ` / ${unit}` : ""}`;
}

function summaryText(row: AdminListingRow) {
  const submitted = row.date ? new Date(row.date).toLocaleString() : "";
  const parts = [
    row.title,
    [row.categoryName || row.category, row.channel].filter(Boolean).join(" · "),
    row.rcNumber ? `RC ${row.rcNumber}` : "",
    `Area: ${areaLabel(row)}`,
    submitted ? `Submitted ${submitted}` : "",
    row.removalReason ? `Removal note: ${row.removalReason}` : ""
  ].filter(Boolean);
  return parts.join("\n");
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ListingsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminListingRow[]>([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [review, setReview] = useState<AdminListingRow | null>(null);
  const [violation, setViolation] = useState<"no" | "yes">("no");
  const [removing, setRemoving] = useState<AdminListingRow | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || token.startsWith("local-admin-")) {
      setError("Log in with the admin account to load listings.");
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminListings(token);
      setRows(data.listings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "Approved");
    if (filter === "pending") return rows.filter((row) => row.status === "Pending");
    if (filter === "flagged") return rows.filter((row) => row.flags > 0);
    return rows;
  }, [filter, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const setStatus = async (row: AdminListingRow, action: "approve" | "unpublish", note?: string) => {
    if (!token || token.startsWith("local-admin-")) return;
    setBusyId(row.id);
    setFormError(null);
    setError(null);
    try {
      await respondAdminListing(token, row.id, action, note);
      setReview(null);
      setRemoving(null);
      setReason("");
      setViolation("no");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update listing";
      if (removing || review) setFormError(message);
      else setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const pageItems = useMemo(() => {
    if (filtered.length === 0) return [] as Array<number | "ellipsis">;
    const items: Array<number | "ellipsis"> = [];
    const max = totalPages;
    const windowStart = Math.max(1, Math.min(page - 2, max - 4));
    for (let i = windowStart; i <= Math.min(max, windowStart + 4); i += 1) items.push(i);
    if (items[items.length - 1] !== max) {
      if ((items[items.length - 1] as number) < max - 1) items.push("ellipsis");
      items.push(max);
    }
    return items;
  }, [filtered.length, page, totalPages]);

  const openReview = (row: AdminListingRow) => {
    setReview(row);
    setViolation("no");
    setFormError(null);
  };

  const openRemoval = (row: AdminListingRow) => {
    setRemoving(row);
    setReason(violation === "yes" && review?.id === row.id ? "Violation of policy" : "");
    setFormError(null);
  };

  return (
    <AdminLayout
      title="Listing"
      titleAccent
      breadcrumbs={[
        { label: "Home", to: "/overview" },
        { label: "User Content" },
        { label: "Listing" }
      ]}
    >
      <div className="listings-page">
        <div className="listings-filters" role="tablist" aria-label="Listing status">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`listings-filters__btn${filter === item.id ? " is-active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="listings-table-wrap">
          <table className="listings-table">
            <thead>
              <tr>
                <th>LISTING</th>
                <th>OWNER/PROVIDER</th>
                <th>RATE</th>
                <th>AREA</th>
                <th>FLAGS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={7} className="listings-empty">
                    {error}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="listings-empty">
                    Loading listings…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="listings-empty">
                    No listings found.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const status = displayStatus(row.status);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="listings-content">
                          <strong>{row.title}</strong>
                          <em>{row.subtitle}</em>
                        </div>
                      </td>
                      <td>
                        <div className="listings-user">
                          <span className="listings-user__avatar">
                            {row.submitterAvatarUrl ? <img src={row.submitterAvatarUrl} alt="" /> : null}
                          </span>
                          <span className="listings-user__text">
                            <strong>{row.submitterName}</strong>
                            <em>{roleLabel(row.submitterRole)}</em>
                          </span>
                        </div>
                      </td>
                      <td>{rateLabel(row)}</td>
                      <td>{areaLabel(row)}</td>
                      <td>
                        {row.flags > 0 ? (
                          <span className="listings-flag">{row.flags}</span>
                        ) : (
                          <span className="listings-flag-empty">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`listings-status listings-status--${status.toLowerCase()}`}>{status}</span>
                      </td>
                      <td>
                        <div className="listings-actions">
                          <button type="button" className="listings-btn listings-btn--view" onClick={() => openReview(row)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="listings-btn listings-btn--remove"
                            disabled={row.status === "Unpublished" || busyId === row.id}
                            onClick={() => openRemoval(row)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? (
          <div className="listings-pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <div className="listings-pager__pages">
              {pageItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`e-${index}`} className="listings-pager__ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={item === page ? "is-active" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {review ? (
        <div className="listing-modal" role="dialog" aria-modal="true" aria-label="Listing Review">
          <button type="button" className="listing-modal__backdrop" aria-label="Close" onClick={() => setReview(null)} />
          <section className="listing-modal__card">
            <header className="listing-modal__header">
              <button type="button" className="listing-modal__back" onClick={() => setReview(null)} aria-label="Back">
                <BackIcon />
              </button>
              <h2>Listing Review</h2>
            </header>
            <div className="listing-modal__hero">
              <div className="listing-modal__avatar">
                {review.submitterAvatarUrl ? <img src={review.submitterAvatarUrl} alt="" /> : null}
              </div>
              <div>
                <h3>{review.submitterName}</h3>
                <p>{roleLabel(review.submitterRole)}</p>
              </div>
            </div>
            <label className="listing-modal__label" htmlFor="listing-summary">
              SUMMARY
            </label>
            <textarea id="listing-summary" className="listing-modal__note" readOnly value={summaryText(review)} />
            <p className="listing-modal__label">VIOLATION OF POLICY?</p>
            <div className="listing-modal__choices">
              <label className={violation === "no" ? "is-on" : ""}>
                <input type="radio" name="violation" checked={violation === "no"} onChange={() => setViolation("no")} />
                <span />
                No
              </label>
              <label className={violation === "yes" ? "is-on" : ""}>
                <input type="radio" name="violation" checked={violation === "yes"} onChange={() => setViolation("yes")} />
                <span />
                Yes
              </label>
            </div>
            {formError && !removing ? <p className="listing-modal__error">{formError}</p> : null}
            <footer className="listing-modal__footer">
              <button
                type="button"
                className="listing-modal__approve"
                disabled={review.status === "Approved" || busyId === review.id}
                onClick={() => void setStatus(review, "approve")}
              >
                Approve Listing
              </button>
              <button
                type="button"
                className="listing-modal__reject"
                disabled={review.status === "Unpublished" || busyId === review.id}
                onClick={() => openRemoval(review)}
              >
                Reject
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {removing ? (
        <div className="listing-modal listing-modal--front" role="dialog" aria-modal="true" aria-label="Listing Removed">
          <button type="button" className="listing-modal__backdrop" aria-label="Close" onClick={() => setRemoving(null)} />
          <section className="listing-modal__card">
            <header className="listing-modal__header">
              <button type="button" className="listing-modal__back" onClick={() => setRemoving(null)} aria-label="Back">
                <BackIcon />
              </button>
              <h2>Listing Removed</h2>
            </header>
            <div className="listing-modal__hero">
              <div className="listing-modal__avatar">
                {removing.submitterAvatarUrl ? <img src={removing.submitterAvatarUrl} alt="" /> : null}
              </div>
              <div>
                <h3>{removing.submitterName}</h3>
                <p>{roleLabel(removing.submitterRole)}</p>
              </div>
            </div>
            <label className="listing-modal__label" htmlFor="listing-reason">
              REASON FOR REMOVAL (REQUIRED)
            </label>
            <textarea
              id="listing-reason"
              className="listing-modal__note"
              placeholder="Eg. Fraudulent listing"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            {formError ? <p className="listing-modal__error">{formError}</p> : null}
            <footer className="listing-modal__footer listing-modal__footer--end">
              <button type="button" className="listing-modal__cancel" onClick={() => setRemoving(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="listing-modal__confirm"
                disabled={busyId === removing.id || reason.trim().length < 3}
                onClick={() => void setStatus(removing, "unpublish", reason.trim())}
              >
                {busyId === removing.id ? "…" : "Confirm Removal"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
