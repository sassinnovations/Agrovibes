import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../auth/AuthContext";
import { fetchAdminKyc, respondAdminKyc, type AdminKycDocument, type AdminKycRow } from "../api/kyc";
import "./KycVerificationPage.css";

function formatSubmitted(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function maskedAadhaar(summary: string) {
  const match = summary.match(/ending\s+(\d{4})/i);
  return match ? `XXXX XXXX ${match[1]}` : "—";
}

function panFromSummary(summary: string) {
  const match = summary.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
  return match ? match[1] : "—";
}

const PLACEHOLDER_DOCS: AdminKycDocument[] = [
  { key: "government-id", label: "Government ID", url: "" },
  { key: "aadhaar", label: "Aadhaar card", url: "" },
  { key: "pan", label: "PAN card", url: "" },
  { key: "tractor-rc", label: "Tractor RC", url: "" }
];

type DocMark = "flag" | "reject" | "approve";

function roleLabel(role: string) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "service") return "Service Provider";
  if (normalized === "both") return "Rental & Service";
  return "Rental Provider";
}

function registrationTypeLabel(value?: string | null) {
  return String(value || "").toLowerCase() === "business" ? "Business / Company" : "Individual";
}

const LOGIN_NOTICE_KEY = "cropvibe_admin_login_notice";

function isExpiredAdminSession(message: string) {
  return /invalid auth token|session expired|missing auth token/i.test(message);
}

export function KycVerificationPage() {
  const { token, signOut } = useAuth();
  const [rows, setRows] = useState<AdminKycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ docs: AdminKycDocument[]; index: number; applicant: string } | null>(
    null
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [docMarks, setDocMarks] = useState<Record<string, DocMark>>({});
  const [reuploadNote, setReuploadNote] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setError("Admin session missing. Please log in again.");
      setLoading(false);
      return;
    }
    if (token.startsWith("local-admin-")) {
      setError("Local admin session cannot load KYC. Log in with a real admin API account.");
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminKyc(token);
      setRows(data.submissions || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load KYC submissions";
      if (isExpiredAdminSession(message)) {
        sessionStorage.setItem(
          LOGIN_NOTICE_KEY,
          "Your admin login expired. Log in again to see provider requests."
        );
        signOut();
        return;
      }
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, signOut]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const onRespond = async (id: number, action: "approve" | "reject") => {
    if (!token || token.startsWith("local-admin-")) return;
    setBusyId(id);
    try {
      await respondAdminKyc(token, id, action);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} KYC`);
    } finally {
      setBusyId(null);
    }
  };

  const activeDoc = preview?.docs[preview.index] || null;
  const selected = rows.find((row) => row.id === selectedId) || null;
  const selectedDocs =
    selected && Array.isArray(selected.documents) && selected.documents.length > 0
      ? selected.documents
      : PLACEHOLDER_DOCS;

  const openReview = (id: number) => {
    setSelectedId(id);
    setDocMarks({});
    setReuploadNote("");
  };

  const markDoc = (key: string, mark: DocMark) => {
    setDocMarks((current) => {
      const next = { ...current };
      if (next[key] === mark) delete next[key];
      else next[key] = mark;
      return next;
    });
  };

  return (
    <AdminLayout
      title="KYC Verification"
      titleAccent
      breadcrumbs={[
        { label: "Home", to: "/overview" },
        { label: "Verification" },
        { label: "KYC verification" }
      ]}
    >
      <div className="kyc-page">
        {error ? <p className="kyc-error">{error}</p> : null}
        {selected ? (
          <article className="kyc-review">
            <header className="kyc-review__head">
              <button type="button" className="kyc-review__back" aria-label="Back to list" onClick={() => setSelectedId(null)}>
                ←
              </button>
              <div>
                <h2>{selected.applicant}</h2>
                <p className="kyc-review__meta">
                  {roleLabel(selected.role)} | Submitted {formatSubmitted(selected.submitted)} |{" "}
                  <span className={String(selected.priority).toLowerCase() === "high" ? "kyc-review__priority" : ""}>
                    {selected.priority} Priority
                  </span>
                </p>
              </div>
            </header>

            <section className="kyc-review__section">
              <h3>APPLICANT DETAILS</h3>
              <dl className="kyc-review__grid">
                <div>
                  <dt>Phone number</dt>
                  <dd>{selected.phone || "—"}</dd>
                </div>
                <div>
                  <dt>Business name</dt>
                  <dd>{selected.businessName || "—"}</dd>
                </div>
                <div>
                  <dt>Email address</dt>
                  <dd>{selected.email || selected.applicantEmail || "—"}</dd>
                </div>
                <div>
                  <dt>GST number</dt>
                  <dd>{selected.gstNumber || "—"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{selected.address || "—"}</dd>
                </div>
                <div>
                  <dt>Registration type</dt>
                  <dd>{registrationTypeLabel(selected.registrationType)}</dd>
                </div>
                <div>
                  <dt>Aadhaar number</dt>
                  <dd>{maskedAadhaar(selected.document || "")}</dd>
                </div>
                <div>
                  <dt>Years of experience</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>PAN number</dt>
                  <dd>{panFromSummary(selected.document || "")}</dd>
                </div>
              </dl>
            </section>

            <section className="kyc-review__section">
              <h3>UPLOADED DOCUMENTS</h3>
              <div className="kyc-review__docs">
                {selectedDocs.map((doc, index) => {
                  const mark = docMarks[doc.key];
                  return (
                    <div key={`${selected.id}-${doc.key}-${index}`} className={`kyc-review__card ${mark ? `is-${mark}` : ""}`}>
                      <p className="kyc-review__card-label">{doc.label}</p>
                      {doc.url ? (
                        <button
                          type="button"
                          className="kyc-review__preview"
                          onClick={() =>
                            setPreview({
                              docs: selectedDocs.filter((item) => item.url),
                              index: selectedDocs.filter((item) => item.url).findIndex((item) => item.key === doc.key),
                              applicant: selected.applicant || "Applicant"
                            })
                          }
                        >
                          <img src={doc.url} alt={doc.label} />
                        </button>
                      ) : (
                        <div className="kyc-review__preview">No image uploaded</div>
                      )}
                      <div className="kyc-review__card-actions">
                        <button
                          type="button"
                          className={`kyc-review__mini kyc-review__mini--flag ${mark === "flag" ? "is-on" : ""}`}
                          onClick={() => markDoc(doc.key, "flag")}
                        >
                          Flag
                        </button>
                        <button
                          type="button"
                          className={`kyc-review__mini kyc-review__mini--reject ${mark === "reject" ? "is-on" : ""}`}
                          onClick={() => markDoc(doc.key, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className={`kyc-review__mini kyc-review__mini--approve ${mark === "approve" ? "is-on" : ""}`}
                          onClick={() => markDoc(doc.key, "approve")}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {reuploadNote ? <p className="kyc-review__note">{reuploadNote}</p> : null}
            <footer className="kyc-review__footer">
              <button
                type="button"
                className="kyc-review__footer-btn kyc-review__footer-btn--reupload"
                onClick={() => setReuploadNote("Reupload noted on this review. The provider must submit again before it can be approved.")}
              >
                Request Reupload
              </button>
              {selected.status === "pending" ? (
                <button
                  type="button"
                  className="kyc-review__footer-btn kyc-review__footer-btn--approve"
                  disabled={busyId === selected.id}
                  onClick={() => void onRespond(selected.id, "approve")}
                >
                  {busyId === selected.id ? "…" : "Approve Application"}
                </button>
              ) : null}
              <button
                type="button"
                className="kyc-review__footer-btn kyc-review__footer-btn--reject"
                disabled={selected.status !== "pending" || busyId === selected.id}
                onClick={() => void onRespond(selected.id, "reject")}
              >
                {selected.status === "rejected" ? "Rejected" : "Reject Application"}
              </button>
            </footer>
          </article>
        ) : null}
        {!selected ? <div className="kyc-table-wrap">
          <table className="kyc-table">
            <thead>
              <tr>
                <th>APPLICANT</th>
                <th>ROLE</th>
                <th>DOCUMENTS</th>
                <th>SUBMITTED</th>
                <th>PRIORITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="kyc-empty-row">
                  <td colSpan={6} className="kyc-empty">
                    Loading KYC submissions…
                  </td>
                </tr>
              ) : error ? (
                <tr className="kyc-empty-row">
                  <td colSpan={6} className="kyc-empty">
                    Provider requests could not be loaded.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr className="kyc-empty-row">
                  <td colSpan={6} className="kyc-empty">
                    No KYC submissions yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const docs = Array.isArray(row.documents) ? row.documents : [];
                  return (
                    <tr
                      key={row.id}
                      className={`${row.status !== "pending" ? `kyc-row--${row.status}` : ""} ${selectedId === row.id ? "is-selected" : ""}`.trim()}
                      onClick={() => openReview(row.id)}
                    >
                      <td>
                        <div>{row.applicant}</div>
                        {row.businessName ? <small className="kyc-muted">{row.businessName}</small> : null}
                        {row.gstNumber ? <small className="kyc-muted">GST: {row.gstNumber}</small> : null}
                        {row.email ? <small className="kyc-muted">{row.email}</small> : null}
                        {row.applicantEmail ? <small className="kyc-muted">{row.applicantEmail}</small> : null}
                        {row.phone ? <small className="kyc-muted">{row.phone}</small> : null}
                      </td>
                      <td>
                        <div>{roleLabel(row.role)}</div>
                        <small className="kyc-muted">{registrationTypeLabel(row.registrationType)}</small>
                      </td>
                      <td className="kyc-docs-cell">
                        {docs.length > 0 ? (
                          <div className="kyc-docs">
                            {docs.map((doc, index) => (
                              <button
                                key={`${row.id}-${doc.key}-${index}`}
                                type="button"
                                className="kyc-doc-thumb"
                                title={doc.label}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPreview({ docs, index, applicant: row.applicant || "Applicant" });
                                }}
                              >
                                <img src={doc.url} alt={doc.label} />
                                <span>{doc.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="kyc-muted">{row.document || "No images"}</span>
                        )}
                      </td>
                      <td>{formatSubmitted(row.submitted)}</td>
                      <td>
                        <span
                          className={`kyc-priority kyc-priority--${String(row.priority || "medium").toLowerCase()}`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td>
                        {row.status === "pending" ? (
                          <div className="kyc-actions" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              className="kyc-btn kyc-btn--approve"
                              disabled={busyId === row.id}
                              onClick={() => void onRespond(row.id, "approve")}
                            >
                              {busyId === row.id ? "…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="kyc-btn kyc-btn--reject"
                              disabled={busyId === row.id}
                              onClick={() => void onRespond(row.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`kyc-status kyc-status--${row.status}`}>
                            {row.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div> : null}
      </div>

      {preview && activeDoc ? (
        <div
          className="kyc-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreview(null);
          }}
        >
          <div className="kyc-lightbox__panel" onClick={(e) => e.stopPropagation()}>
            <div className="kyc-lightbox__head">
              <div>
                <strong>{preview.applicant}</strong>
                <p>{activeDoc.label}</p>
              </div>
              <button type="button" className="kyc-lightbox__close" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            <img className="kyc-lightbox__img" src={activeDoc.url} alt={activeDoc.label} />
            <div className="kyc-lightbox__nav">
              <button
                type="button"
                disabled={preview.index <= 0}
                onClick={() => setPreview((p) => (p ? { ...p, index: Math.max(0, p.index - 1) } : p))}
              >
                Previous
              </button>
              <span>
                {preview.index + 1} / {preview.docs.length}
              </span>
              <button
                type="button"
                disabled={preview.index >= preview.docs.length - 1}
                onClick={() =>
                  setPreview((p) =>
                    p ? { ...p, index: Math.min(p.docs.length - 1, p.index + 1) } : p
                  )
                }
              >
                Next
              </button>
              <a href={activeDoc.url} target="_blank" rel="noreferrer">
                Open original
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
