import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { createProviderRazorpayAccount } from "../../api/providerKyc";
import { readProviderDraft, writeProviderDraft } from "./providerDraft";
import { readSavedBank, writeSavedBank } from "./ProviderBankPage";

function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

function Field({
  label,
  value,
  locked,
  onChange,
  inputMode
}: {
  label: string;
  value: string;
  locked: boolean;
  onChange: (value: string) => void;
  inputMode?: "email" | "numeric" | "text";
}) {
  return (
    <label>
      {label}
      {locked ? (
        <span className="provider-bank__readonly">{value}</span>
      ) : (
        <input
          value={value}
          inputMode={inputMode === "numeric" ? "numeric" : inputMode === "email" ? "email" : "text"}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function ProviderRazorpayPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const bank = readSavedBank();
  const draft = readProviderDraft();
  const preset = useMemo(
    () => ({
      email: draft.email.trim() || user?.email?.trim() || "",
      phone: digits(draft.phone || user?.phone || "", 10),
      street: (draft.street || draft.village).trim(),
      city: (draft.district || draft.village).trim(),
      state: draft.state.trim(),
      pin: digits(draft.pinCode, 6)
    }),
    [draft.district, draft.email, draft.phone, draft.pinCode, draft.state, draft.street, draft.village, user?.email, user?.phone]
  );
  const [email, setEmail] = useState(preset.email);
  const [phone, setPhone] = useState(preset.phone);
  const [street, setStreet] = useState(preset.street);
  const [city, setCity] = useState(preset.city);
  const [state, setState] = useState(preset.state);
  const [pin, setPin] = useState(preset.pin);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!bank) return <Navigate to="/provider/bank" replace />;
  if (bank.razorpayAccountId) return <Navigate to="/provider" replace />;

  const ready =
    email.includes("@") &&
    digits(phone, 10).length === 10 &&
    street.trim().length > 1 &&
    city.trim().length > 1 &&
    state.trim().length > 1 &&
    digits(pin, 6).length === 6;

  const linkAccount = async () => {
    if (!token || !ready) return;
    setBusy(true);
    setError("");
    try {
      const linked = await createProviderRazorpayAccount(token, {
        accountNumber: bank.accountNumber,
        ifsc: bank.ifsc,
        holderName: bank.holderName,
        email: email.trim(),
        phone: digits(phone, 10),
        businessName: draft.businessName || draft.fullName || bank.holderName,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: digits(pin, 6)
      });
      if (!linked.linked || !linked.accountId) {
        setError(linked.message || "Razorpay did not link an account yet.");
        return;
      }
      writeSavedBank({ ...bank, razorpayAccountId: linked.accountId });
      writeProviderDraft({
        ...readProviderDraft(),
        email: email.trim(),
        phone: digits(phone, 10),
        street: street.trim(),
        district: city.trim(),
        state: state.trim(),
        pinCode: digits(pin, 6),
        bankVerified: true,
        holderName: bank.holderName,
        accountNumber: bank.accountNumber,
        ifsc: bank.ifsc,
        bankName: bank.bankName || "",
        bankBranch: bank.bankBranch || ""
      });
      navigate("/provider");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link the Razorpay account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="provider-panel">
      <Link className="provider-back" to="/provider">
        Back
      </Link>
      <h1>Razorpay details</h1>
      <p className="provider-note">The verified bank account stays as recorded. Other details are filled from registration and can be entered only when they are missing.</p>
      <form
        className="provider-bank"
        onSubmit={(event) => {
          event.preventDefault();
          void linkAccount();
        }}
      >
        <Field label="Account holder" value={bank.holderName} locked onChange={() => undefined} />
        <Field label="Account number" value={bank.accountNumber} locked onChange={() => undefined} />
        <Field label="IFSC" value={bank.ifsc} locked onChange={() => undefined} />
        {bank.bankName || bank.bankBranch ? (
          <Field
            label="Bank"
            value={[bank.bankName, bank.bankBranch].filter(Boolean).join(" · ")}
            locked
            onChange={() => undefined}
          />
        ) : null}
        <Field label="Email" value={email} locked={Boolean(preset.email)} onChange={setEmail} inputMode="email" />
        <Field label="Mobile" value={phone} locked={Boolean(preset.phone)} onChange={(value) => setPhone(digits(value, 10))} inputMode="numeric" />
        <Field label="Street" value={street} locked={Boolean(preset.street)} onChange={setStreet} />
        <Field label="City" value={city} locked={Boolean(preset.city)} onChange={setCity} />
        <Field label="State" value={state} locked={Boolean(preset.state)} onChange={setState} />
        <Field label="PIN code" value={pin} locked={Boolean(preset.pin)} onChange={(value) => setPin(digits(value, 6))} inputMode="numeric" />
        {error ? <p className="provider-bank__error">{error}</p> : null}
        <button type="submit" disabled={busy || !ready}>
          {busy ? "Linking…" : "Link Razorpay"}
        </button>
        <Link className="provider-bank__change" to="/provider/bank?edit=1">
          Use a different bank account
        </Link>
      </form>
    </section>
  );
}
