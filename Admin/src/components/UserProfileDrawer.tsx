import { useEffect, useState } from "react";
import type { AccountStatus, AdminUserProfile } from "../types/adminUser";
import "./UserProfileDrawer.css";

type Props = {
  user: AdminUserProfile | null;
  open: boolean;
  token: string | null;
  apiBase: string;
  onClose: () => void;
  onUpdated: (id: string, accountStatus: AccountStatus) => void;
};

const SUSPEND_REASONS = [
  "Off-platform payment solicitation",
  "Abusive review content",
  "Spam or misleading content",
  "Fraud or impersonation",
  "Other (Specify in note)"
];

function DetailItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="user-profile__detail">
      <span className="user-profile__detail-icon" aria-hidden="true" />
      <div>
        <p className="user-profile__detail-label">{label}</p>
        <p className={`user-profile__detail-value${accent ? " is-accent" : ""}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function UserProfileDrawer({ user, open, token, apiBase, onClose, onUpdated }: Props) {
  const [mode, setMode] = useState<"suspend" | "ban" | null>(null);
  const [reasonChoice, setReasonChoice] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState<"indefinite" | "until">("indefinite");
  const [untilDate, setUntilDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setReasonChoice("");
      setNote("");
      setDuration("indefinite");
      setUntilDate("");
      setFormError(null);
    }
  }, [open, user?.id]);

  if (!open || !user) return null;

  const flagItems = user.flagItems || [];
  const kycItems = user.kycItems || [];
  const otherReason = reasonChoice === "Other (Specify in note)";
  const suspendReason = otherReason ? note.trim() : reasonChoice;
  const canConfirmSuspend =
    suspendReason.length >= 3 && (duration === "indefinite" || untilDate.length > 0);
  const canConfirmBan = note.trim().length >= 3;

  async function submit(action: "suspend" | "ban") {
    if (!user) return;
    if (!token) {
      setFormError("Sign in again to update this user.");
      return;
    }
    const reason = action === "ban" ? note.trim() : suspendReason;
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch(`${apiBase}/v1/admin/users/${user.id}/moderation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          reason,
          until: action === "suspend" && duration === "until" ? untilDate : ""
        })
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Could not update this user");
      }
      onUpdated(user.id, action === "ban" ? "Banned" : "Suspended");
      setMode(null);
      setReasonChoice("");
      setNote("");
      setDuration("indefinite");
      setUntilDate("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update this user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="user-profile" role="dialog" aria-modal="true" aria-label="User Profile">
      <button type="button" className="user-profile__backdrop" aria-label="Close profile" onClick={onClose} />
      <section className="user-profile__card">
        <header className="user-profile__header">
          <button type="button" className="user-profile__back" onClick={onClose} aria-label="Back">
            <BackIcon />
          </button>
          <h2>User Profile</h2>
        </header>

        <div className="user-profile__hero">
          <div className="user-profile__avatar">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
          </div>
          <div>
            <h3>{user.name}</h3>
            <p>{user.role}</p>
          </div>
        </div>

        <section className="user-profile__block">
          <h4>APPLICANT DETAILS</h4>
          <div className="user-profile__grid">
            <DetailItem label="Phone" value={user.phone || "—"} />
            <DetailItem label="Email" value={user.email || "—"} />
            <DetailItem label="Location" value={user.location || user.region || "—"} />
            <DetailItem label="Farmer ID" value={user.farmerId || "—"} />
            <DetailItem label="PAN" value={user.pan || "—"} />
            <DetailItem label="Aadhaar" value={user.aadhaar || "—"} />
            <DetailItem label="Joined" value={user.joined || "—"} />
            <DetailItem label="Status" value={user.accountStatus} accent={user.accountStatus === "Active"} />
          </div>
        </section>

        <section className="user-profile__block">
          <h4>
            FLAGS
            {user.flags > 0 ? <span className="user-profile__badge">{user.flags}</span> : null}
          </h4>
          {flagItems.length === 0 ? (
            <p className="user-profile__empty">No flags.</p>
          ) : (
            <ul className="user-profile__flags">
              {flagItems.map((item) => (
                <li key={item.id}>
                  <span className="user-profile__flag-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                  <em>{item.when}</em>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="user-profile__block">
          <h4>KYC</h4>
          {kycItems.length === 0 ? (
            <p className="user-profile__empty">No KYC documents.</p>
          ) : (
            <ul className="user-profile__kyc">
              {kycItems.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <em>{item.value || "—"}</em>
                  </div>
                  <span className={`user-profile__kyc-status user-profile__kyc-status--${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="user-profile__actions">
          <button type="button" className="user-profile__suspend" onClick={() => setMode("suspend")}>
            Suspend User
          </button>
          <button type="button" className="user-profile__ban" onClick={() => setMode("ban")}>
            Ban User
          </button>
        </footer>
      </section>

      {mode ? (
        <div className="user-moderation" role="dialog" aria-modal="true" aria-label={mode === "ban" ? "Ban User" : "Suspend User"}>
          <button type="button" className="user-moderation__backdrop" aria-label="Close" onClick={() => setMode(null)} />
          <section className="user-moderation__card">
            <header className="user-profile__header">
              <button type="button" className="user-profile__back" onClick={() => setMode(null)} aria-label="Back">
                <BackIcon />
              </button>
              <h2>{mode === "ban" ? "Ban User" : "Suspend User"}</h2>
            </header>

            <div className="user-profile__hero">
              <div className="user-profile__avatar">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
              </div>
              <div>
                <h3>{user.name}</h3>
                <p>{user.role}</p>
              </div>
            </div>

            {mode === "suspend" ? (
              <>
                <label className="user-moderation__label" htmlFor="suspend-reason">
                  REASON (REQUIRED)
                </label>
                <select
                  id="suspend-reason"
                  className="user-moderation__select"
                  value={reasonChoice}
                  onChange={(event) => setReasonChoice(event.target.value)}
                >
                  <option value="">Select a ban reason</option>
                  {SUSPEND_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {otherReason ? (
                  <>
                    <label className="user-moderation__label" htmlFor="suspend-note">
                      SPECIFY REASON (REQUIRED)
                    </label>
                    <textarea
                      id="suspend-note"
                      className="user-moderation__note"
                      placeholder="Describe the specific reason"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </>
                ) : null}
                <p className="user-moderation__label">DURATION</p>
                <div className="user-moderation__duration">
                  <label className={duration === "indefinite" ? "is-on" : ""}>
                    <input
                      type="radio"
                      name="suspend-duration"
                      checked={duration === "indefinite"}
                      onChange={() => setDuration("indefinite")}
                    />
                    <span />
                    Indefinite
                  </label>
                  <label className={duration === "until" ? "is-on" : ""}>
                    <input
                      type="radio"
                      name="suspend-duration"
                      checked={duration === "until"}
                      onChange={() => setDuration("until")}
                    />
                    <span />
                    Until date
                  </label>
                  {duration === "until" ? (
                    <input
                      className="user-moderation__date"
                      type="date"
                      value={untilDate}
                      onChange={(event) => setUntilDate(event.target.value)}
                      aria-label="Suspend until"
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <label className="user-moderation__label" htmlFor="ban-reason">
                  REASON FOR BAN (REQUIRED)
                </label>
                <textarea
                  id="ban-reason"
                  className="user-moderation__note"
                  placeholder="Warning is Permanent - Document the Reason"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </>
            )}

            {formError ? <p className="user-moderation__error">{formError}</p> : null}

            <footer className="user-moderation__footer">
              <button type="button" className="user-moderation__cancel" onClick={() => setMode(null)}>
                Cancel
              </button>
              {mode === "ban" || canConfirmSuspend ? (
                <button
                  type="button"
                  className="user-moderation__confirm"
                  disabled={busy || (mode === "ban" ? !canConfirmBan : !canConfirmSuspend)}
                  onClick={() => void submit(mode)}
                >
                  {busy ? "…" : "Confirm"}
                </button>
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
