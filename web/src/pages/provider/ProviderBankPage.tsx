import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchProviderKycStatus, verifyProviderBankAccount } from "../../api/providerKyc";
import { readProviderDraft } from "./providerDraft";

const BANK_KEY = "cropvibe.provider.bank.v2";
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export type SavedBank = {
  holderName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string;
  bankBranch?: string;
  razorpayAccountId?: string;
};

export function readSavedBank(): SavedBank | null {
  try {
    const raw = sessionStorage.getItem(BANK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBank;
    if (!parsed.accountNumber || !parsed.ifsc) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedBank(bank: SavedBank) {
  sessionStorage.setItem(BANK_KEY, JSON.stringify(bank));
}

export function ProviderBankPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = params.get("edit") === "1";
  const [savedBank, setSavedBank] = useState<SavedBank | null>(() => readSavedBank());
  const [approved, setApproved] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [account, setAccount] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [ifscDetails, setIfscDetails] = useState(true);
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  useEffect(() => {
    if (!savedBank || editing || savedBank.razorpayAccountId) return;
    navigate("/provider/razorpay", { replace: true });
  }, [editing, navigate, savedBank]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void fetchProviderKycStatus(token)
      .then((kyc) => {
        if (active) setApproved(kyc.status === "approved");
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load provider setup.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!savedBank) return;
    setHolderName(savedBank.holderName);
    setAccount(savedBank.accountNumber);
    setConfirmAccount(savedBank.accountNumber);
    setIfsc(savedBank.ifsc);
  }, [savedBank]);

  const accountDigits = account.replace(/\D/g, "");
  const confirmDigits = confirmAccount.replace(/\D/g, "");
  const ifscCode = ifsc.toUpperCase();
  const formReady =
    holderName.trim().length > 1 &&
    accountDigits.length >= 6 &&
    accountDigits === confirmDigits &&
    IFSC_PATTERN.test(ifscCode);

  const verifyBank = async () => {
    if (!token) return;
    if (accountDigits !== confirmDigits) {
      setError("The account numbers do not match.");
      return;
    }
    if (!IFSC_PATTERN.test(ifscCode)) {
      setError("Enter an 11-character IFSC, such as SBIN0001234.");
      return;
    }
    const draft = readProviderDraft();
    setBusy(true);
    setError("");
    try {
      const result = await verifyProviderBankAccount(token, {
        accountNumber: accountDigits,
        ifsc: ifscCode,
        ifscDetails,
        applicantName: holderName.trim(),
        phone: draft.phone
      });
      setBankName(result.bankName || "");
      setBankBranch(result.bankBranch || "");
      if (!result.matched) {
        setError(`The bank account is in the name of ${result.holderName}. It does not match the verified Aadhaar name${result.aadhaarName ? `, ${result.aadhaarName}` : ""}.`);
        return;
      }
      const typed = holderName.trim().toLowerCase();
      const returned = result.holderName.trim().toLowerCase();
      if (typed && returned && !returned.includes(typed) && !typed.includes(returned)) {
        setError(`Bank records show ${result.holderName}. Enter that name, then verify again.`);
        return;
      }
      const next: SavedBank = {
        holderName: result.holderName,
        accountNumber: accountDigits,
        ifsc: ifscCode,
        bankName: result.bankName || bankName,
        bankBranch: result.bankBranch || bankBranch,
        razorpayAccountId: savedBank?.razorpayAccountId
      };
      writeSavedBank(next);
      setSavedBank(next);
      navigate("/provider/razorpay");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the bank account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="provider-panel">
      <Link className="provider-back" to="/provider">
        Back
      </Link>
      <h1>Add Bank Account</h1>
      {!ready ? <p>Loading…</p> : null}
      {ready && !approved ? (
        <p className="provider-note">Admin approval is required before a bank account can be added.</p>
      ) : null}
      {ready && approved ? (
        <form
          className="provider-bank"
          onSubmit={(event) => {
            event.preventDefault();
            void verifyBank();
          }}
        >
          <label>
            Account Holder Name
            <input value={holderName} onChange={(event) => setHolderName(event.target.value)} placeholder="Name as per bank records" />
          </label>
          <label>
            Bank Account Number
            <input value={account} onChange={(event) => setAccount(event.target.value.replace(/[^\d]/g, ""))} placeholder="Enter account number" inputMode="numeric" />
          </label>
          <label>
            Confirm Account Number
            <input value={confirmAccount} onChange={(event) => setConfirmAccount(event.target.value.replace(/[^\d]/g, ""))} placeholder="Re-enter account number" inputMode="numeric" />
          </label>
          <label>
            IFSC Code
            <input value={ifsc} onChange={(event) => setIfsc(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} placeholder="e.g. SBIN0001234" />
          </label>
          <label className="provider-bank__check">
            <input type="checkbox" checked={ifscDetails} onChange={(event) => setIfscDetails(event.target.checked)} />
            IFSC Details
          </label>
          {bankName || bankBranch ? (
            <p className="provider-bank__meta">
              {bankName}
              {bankBranch ? ` · ${bankBranch}` : ""}
            </p>
          ) : null}
          {error ? <p className="provider-bank__error">{error}</p> : null}
          <button type="submit" disabled={busy || !formReady}>
            {busy ? "Verifying…" : "Verify & Save Bank Account"}
          </button>
        </form>
      ) : null}
      {ready && !approved && error ? <p className="provider-bank__error">{error}</p> : null}
    </section>
  );
}
